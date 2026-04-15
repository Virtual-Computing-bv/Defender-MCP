import { z } from "zod";
import { defenderApiRequest } from "../api-client.js";

// ─── Schema definitions ───────────────────────────────────────────────────────

export const ListIncidentsSchema = z.object({
  filter: z
    .string()
    .optional()
    .describe(
      "OData filter expression. Examples: \"status eq 'Active'\", \"severity eq 'High'\", \"createdTime gt 2024-01-01T00:00:00Z\""
    ),
  top: z
    .number()
    .optional()
    .describe("Maximum number of incidents to return (max 100)"),
  skip: z.number().optional().describe("Number of entries to skip for pagination"),
  orderby: z
    .string()
    .optional()
    .describe("Order by property. Examples: \"createdTime desc\", \"severity desc\""),
});

export const GetIncidentByIdSchema = z.object({
  incidentId: z
    .string()
    .describe("The unique numeric or string ID of the incident (as shown in the Defender portal)"),
});

export const GetIncidentAlertsSchema = z.object({
  incidentId: z
    .string()
    .describe("The unique ID of the incident to retrieve alerts for"),
  top: z
    .number()
    .optional()
    .describe("Maximum number of alerts to return (default: 10). Use with skip for pagination."),
  skip: z
    .number()
    .optional()
    .describe("Number of alerts to skip for pagination (default: 0)."),
  summaryOnly: z
    .boolean()
    .optional()
    .describe("If true, returns only alert title, id, severity, category, status, MITRE techniques, and first/last activity — no full evidence entities. Useful for large incidents."),
});

export const UpdateIncidentSchema = z.object({
  incidentId: z.string().describe("The unique ID of the incident to update"),
  status: z
    .enum(["Active", "Resolved", "Redirected"])
    .optional()
    .describe("Incident status"),
  assignedTo: z
    .string()
    .optional()
    .describe("Owner/assignee of the incident (UPN or email)"),
  classification: z
    .enum(["Unknown", "FalsePositive", "TruePositive", "InformationalExpectedActivity"])
    .optional()
    .describe("Classification of the incident"),
  determination: z
    .enum([
      "NotAvailable",
      "Apt",
      "Malware",
      "SecurityPersonnel",
      "SecurityTesting",
      "UnwantedSoftware",
      "Other",
      "MultiStagedAttack",
      "CompromisedUser",
      "Phishing",
      "MaliciousUserActivity",
      "NotMalicious",
      "MaliciousApp",
      "CorrelationAlert",
      "ExtendedDetection",
    ])
    .optional()
    .describe("Determination/root cause of the incident"),
  comment: z.string().optional().describe("Comment to add to the incident"),
  tags: z
    .array(z.string())
    .optional()
    .describe("Tags to apply to the incident"),
});

// ─── Tool implementations ─────────────────────────────────────────────────────

export async function listIncidents(params: z.infer<typeof ListIncidentsSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};

  if (params.filter)  queryParams.$filter  = params.filter;
  if (params.top)     queryParams.$top     = params.top;
  if (params.skip)    queryParams.$skip    = params.skip;
  if (params.orderby) queryParams.$orderby = params.orderby;

  return defenderApiRequest("/incidents", { queryParams });
}

export async function getIncidentById(params: z.infer<typeof GetIncidentByIdSchema>) {
  return defenderApiRequest(`/incidents/${params.incidentId}`);
}

export async function getIncidentAlerts(params: z.infer<typeof GetIncidentAlertsSchema>) {
  // The /incidents/{id}/alerts sub-resource does not exist in this API.
  // All alerts are embedded in the incident object itself — fetch and slice.
  const incident = await defenderApiRequest(`/incidents/${params.incidentId}`) as { alerts?: Record<string, unknown>[] };
  const allAlerts: Record<string, unknown>[] = incident.alerts ?? [];

  const skip = params.skip ?? 0;
  const top  = params.top  ?? 10;
  const page = allAlerts.slice(skip, skip + top);

  const alerts = params.summaryOnly
    ? page.map((a) => ({
        alertId:        a.alertId,
        title:          a.title,
        severity:       a.severity,
        category:       a.category,
        status:         a.status,
        firstActivity:  a.firstActivity,
        lastActivity:   a.lastActivity,
        mitreTechniques: a.mitreTechniques,
        serviceSource:  a.serviceSource,
        detectionSource: a.detectionSource,
      }))
    : page;

  return {
    incidentId:  params.incidentId,
    totalAlerts: allAlerts.length,
    skip,
    top,
    returned:    alerts.length,
    hasMore:     skip + top < allAlerts.length,
    alerts,
  };
}

export async function updateIncident(params: z.infer<typeof UpdateIncidentSchema>) {
  const { incidentId, ...body } = params;
  return defenderApiRequest(`/incidents/${incidentId}`, {
    method: "PATCH",
    body,
  });
}

// ─── Tool definitions for MCP ─────────────────────────────────────────────────

export const incidentTools = [
  {
    name: "defender_list_incidents",
    description:
      "List incidents from Microsoft Defender XDR. Incidents group related alerts into a single attack story. " +
      "Supports OData filtering by status, severity, createdTime, assignedTo, etc. " +
      "Use this to find incidents before drilling into a specific one.",
    inputSchema: ListIncidentsSchema,
    handler: listIncidents,
  },
  {
    name: "defender_get_incident",
    description:
      "Get full details of a specific incident by its ID, including all metadata: severity, status, " +
      "classification, impacted entities (devices, users, mailboxes), alert count, assigned owner, " +
      "MITRE ATT&CK tactics, and timestamps. " +
      "This is the primary starting point for incident analysis.",
    inputSchema: GetIncidentByIdSchema,
    handler: getIncidentById,
  },
  {
    name: "defender_get_incident_alerts",
    description:
      "Get all alerts that are part of a specific incident, including full alert details: " +
      "title, description, severity, category, MITRE technique, evidence entities (files, IPs, URLs, " +
      "processes, registry keys, users, devices), detection source, and timestamps. " +
      "Supports pagination via 'skip' and 'top' (default 10 per page). " +
      "Set summaryOnly=true to get a lightweight list of all alerts without full evidence trees — " +
      "recommended as the first call on large incidents (50+ alerts). " +
      "Use this after defender_get_incident to enumerate all evidence in the incident.",
    inputSchema: GetIncidentAlertsSchema,
    handler: getIncidentAlerts,
  },
  {
    name: "defender_update_incident",
    description:
      "Update incident properties: status (Active/Resolved/Redirected), assignee, classification, " +
      "determination, comments, and tags. Use this to mark incidents as resolved or add analysis notes.",
    inputSchema: UpdateIncidentSchema,
    handler: updateIncident,
  },
];

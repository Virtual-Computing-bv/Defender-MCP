import { z } from "zod";
import { defenderApiRequest, defenderApiRequestPaginated } from "../api-client.js";

// Schema definitions
export const GetAlertsSchema = z.object({
  filter: z.string().optional().describe("OData filter expression (e.g., \"severity eq 'High'\")"),
  top: z.number().optional().describe("Maximum number of alerts to return (max 10000)"),
  skip: z.number().optional().describe("Number of entries to skip"),
  orderby: z.string().optional().describe("Order by property (e.g., \"alertCreationTime desc\")"),
  expand: z.string().optional().describe("Related entities to expand (e.g., \"evidence\")"),
});

export const GetAlertByIdSchema = z.object({
  alertId: z.string().describe("The unique ID of the alert"),
});

export const UpdateAlertSchema = z.object({
  alertId: z.string().describe("The unique ID of the alert to update"),
  status: z.enum(["New", "InProgress", "Resolved"]).optional().describe("Alert status"),
  assignedTo: z.string().optional().describe("Owner of the alert"),
  classification: z
    .enum(["Unknown", "FalsePositive", "TruePositive"])
    .optional()
    .describe("Classification of the alert"),
  determination: z
    .enum([
      "NotAvailable",
      "Apt",
      "Malware",
      "SecurityPersonnel",
      "SecurityTesting",
      "UnwantedSoftware",
      "Other",
    ])
    .optional()
    .describe("Determination of the alert"),
  comment: z.string().optional().describe("Comment to add to the alert"),
});

export const BatchUpdateAlertsSchema = z.object({
  alertIds: z.array(z.string()).describe("List of alert IDs to update"),
  status: z.enum(["New", "InProgress", "Resolved"]).optional().describe("Alert status"),
  assignedTo: z.string().optional().describe("Owner of the alerts"),
  classification: z
    .enum(["Unknown", "FalsePositive", "TruePositive"])
    .optional()
    .describe("Classification of the alerts"),
  determination: z
    .enum([
      "NotAvailable",
      "Apt",
      "Malware",
      "SecurityPersonnel",
      "SecurityTesting",
      "UnwantedSoftware",
      "Other",
    ])
    .optional()
    .describe("Determination of the alerts"),
  comment: z.string().optional().describe("Comment to add to the alerts"),
});

export const CreateAlertSchema = z.object({
  eventTime: z.string().describe("The time of the event that triggered the alert (ISO 8601)"),
  reportId: z.string().describe("The report ID from advanced hunting"),
  machineId: z.string().describe("The ID of the machine"),
  severity: z.enum(["Low", "Medium", "High", "Informational"]).describe("Alert severity"),
  title: z.string().describe("Alert title"),
  description: z.string().describe("Alert description"),
  recommendedAction: z.string().optional().describe("Recommended action"),
  category: z.string().describe("Alert category"),
});

// Tool implementations
export async function getAlerts(params: z.infer<typeof GetAlertsSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};

  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;
  if (params.skip) queryParams.$skip = params.skip;
  if (params.orderby) queryParams.$orderby = params.orderby;
  if (params.expand) queryParams.$expand = params.expand;

  return defenderApiRequest("/alerts", { queryParams, useWdatp: true });
}

export async function getAlertById(params: z.infer<typeof GetAlertByIdSchema>) {
  return defenderApiRequest(`/alerts/${params.alertId}`, { useWdatp: true });
}

export async function updateAlert(params: z.infer<typeof UpdateAlertSchema>) {
  const { alertId, ...body } = params;
  return defenderApiRequest(`/alerts/${alertId}`, {
    method: "PATCH",
    body,
    useWdatp: true,
  });
}

export async function batchUpdateAlerts(params: z.infer<typeof BatchUpdateAlertsSchema>) {
  return defenderApiRequest("/alerts/batchUpdate", {
    method: "POST",
    body: params,
    useWdatp: true,
  });
}

export async function createAlert(params: z.infer<typeof CreateAlertSchema>) {
  return defenderApiRequest("/alerts/CreateAlertByReference", {
    method: "POST",
    body: params,
    useWdatp: true,
  });
}

// Tool definitions for MCP
export const alertTools = [
  {
    name: "defender_get_alerts",
    description:
      "Get a list of alerts from Microsoft Defender for Endpoint. Supports OData v4 filtering, pagination, and expansion of related entities like evidence.",
    inputSchema: GetAlertsSchema,
    handler: getAlerts,
  },
  {
    name: "defender_get_alert_by_id",
    description: "Get a specific alert by its unique ID from Microsoft Defender for Endpoint.",
    inputSchema: GetAlertByIdSchema,
    handler: getAlertById,
  },
  {
    name: "defender_update_alert",
    description:
      "Update properties of an existing alert including status, classification, determination, assignment, and comments.",
    inputSchema: UpdateAlertSchema,
    handler: updateAlert,
  },
  {
    name: "defender_batch_update_alerts",
    description:
      "Update multiple alerts at once with the same properties (status, classification, determination, assignment, comments).",
    inputSchema: BatchUpdateAlertsSchema,
    handler: batchUpdateAlerts,
  },
  {
    name: "defender_create_alert",
    description:
      "Create a new alert based on event data from advanced hunting. Requires a valid event time, report ID, and machine ID.",
    inputSchema: CreateAlertSchema,
    handler: createAlert,
  },
];

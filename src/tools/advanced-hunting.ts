import { z } from "zod";
import { defenderApiRequest } from "../api-client.js";

// Schema definitions
export const RunAdvancedQuerySchema = z.object({
  query: z
    .string()
    .describe(
      "The Kusto Query Language (KQL) query to execute. Max 100,000 rows returned. Data limited to last 30 days."
    ),
});

export const RunXdrHuntingQuerySchema = z.object({
  query: z
    .string()
    .describe(
      "The Kusto Query Language (KQL) query to execute against Defender XDR data (all workloads: endpoint, identity, email, cloud apps). Max 100,000 rows returned. Data limited to last 30 days."
    ),
});

// Tool implementations

// WDATP advanced hunting — MDE tables only (DeviceInfo, DeviceProcessEvents, etc.)
export async function runAdvancedQuery(params: z.infer<typeof RunAdvancedQuerySchema>) {
  return defenderApiRequest("/advancedqueries/run", {
    method: "POST",
    body: { Query: params.query },
    useWdatp: true,
  });
}

// MTP/XDR advanced hunting — all Defender XDR tables (endpoint + identity + email + cloud)
export async function runXdrHuntingQuery(params: z.infer<typeof RunXdrHuntingQuerySchema>) {
  return defenderApiRequest("/advancedhunting/run", {
    method: "POST",
    body: { Query: params.query },
    useWdatp: false,
  });
}

// Tool definitions for MCP
export const advancedHuntingTools = [
  {
    name: "defender_run_advanced_query",
    description: `Run an advanced hunting query using Kusto Query Language (KQL) against Microsoft Defender for Endpoint data.

Available tables include:
- DeviceInfo: Device information and properties
- DeviceNetworkInfo: Network configuration
- DeviceProcessEvents: Process creation and related events
- DeviceNetworkEvents: Network connections and related events
- DeviceFileEvents: File creation, modification, and other events
- DeviceRegistryEvents: Registry operations
- DeviceLogonEvents: Logon and authentication events
- DeviceImageLoadEvents: DLL loading events
- DeviceEvents: Miscellaneous events
- AlertInfo: Alert information
- AlertEvidence: Evidence associated with alerts

Example queries:
- "DeviceProcessEvents | where Timestamp > ago(1h) | limit 100"
- "AlertInfo | where Severity == 'High' | project AlertId, Title, Timestamp"
- "DeviceNetworkEvents | where RemotePort == 443 | summarize count() by DeviceName"

Note: Max 100,000 rows returned. Data limited to last 30 days.`,
    inputSchema: RunAdvancedQuerySchema,
    handler: runAdvancedQuery,
  },
  {
    name: "defender_run_xdr_hunting_query",
    description: `Run an advanced hunting query using Kusto Query Language (KQL) against Microsoft Defender XDR data. This queries ALL Defender workloads — endpoint, identity, email, and cloud apps — in a single query. Use this for cross-workload correlation and incident investigation.

Available tables include:
- DeviceInfo, DeviceProcessEvents, DeviceNetworkEvents, DeviceFileEvents, DeviceRegistryEvents, DeviceLogonEvents, DeviceImageLoadEvents, DeviceEvents (Endpoint/MDE)
- AlertInfo: Alert metadata across all Defender workloads
- AlertEvidence: Evidence entities associated with alerts
- IdentityInfo: User identity details from Microsoft Entra ID
- IdentityLogonEvents: Authentication events from identity sources
- IdentityDirectoryEvents: Active Directory object changes
- IdentityQueryEvents: LDAP queries and other identity queries
- EmailEvents: Email messages and delivery actions (Defender for Office 365)
- EmailAttachmentInfo: Email attachment metadata
- EmailUrlInfo: URLs in emails
- EmailPostDeliveryEvents: Actions taken on emails after delivery
- CloudAppEvents: Activity in cloud applications (Defender for Cloud Apps)

Example queries:
- "AlertInfo | where Timestamp > ago(7d) | where Title contains 'ransomware'"
- "IdentityLogonEvents | where Timestamp > ago(1d) | where ActionType == 'LogonFailed' | summarize count() by AccountName"
- "AlertEvidence | where AlertId == '<alertId>' | project EntityType, EvidenceRole, FileName, RemoteIP"

Note: Max 100,000 rows returned. Data limited to last 30 days.`,
    inputSchema: RunXdrHuntingQuerySchema,
    handler: runXdrHuntingQuery,
  },
];

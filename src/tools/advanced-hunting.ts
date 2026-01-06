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

// Tool implementations
export async function runAdvancedQuery(params: z.infer<typeof RunAdvancedQuerySchema>) {
  return defenderApiRequest("/advancedqueries/run", {
    method: "POST",
    body: { Query: params.query },
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
];

import { z } from "zod";
import { defenderApiRequest } from "../api-client.js";

// Schema definitions
export const GetIndicatorsSchema = z.object({
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().optional().describe("Maximum number of indicators to return"),
  skip: z.number().optional().describe("Number of entries to skip"),
});

export const CreateIndicatorSchema = z.object({
  indicatorValue: z.string().describe("The indicator value (hash, IP, domain, or URL)"),
  indicatorType: z
    .enum([
      "FileSha1",
      "FileSha256",
      "FileMd5",
      "CertificateThumbprint",
      "IpAddress",
      "DomainName",
      "Url",
    ])
    .describe("Type of indicator"),
  action: z
    .enum(["Warn", "Block", "Audit", "Alert", "AlertAndBlock", "BlockAndRemediate", "Allowed"])
    .describe("Action to take when the indicator is detected"),
  title: z.string().describe("Title/name for the indicator"),
  description: z.string().optional().describe("Description of the indicator"),
  severity: z
    .enum(["Informational", "Low", "Medium", "High"])
    .optional()
    .describe("Severity level"),
  recommendedActions: z.string().optional().describe("Recommended actions when detected"),
  expirationTime: z
    .string()
    .optional()
    .describe("Expiration date/time in ISO 8601 format (optional)"),
  generateAlert: z.boolean().optional().describe("Whether to generate an alert"),
  rbacGroupNames: z.array(z.string()).optional().describe("RBAC group names to scope the indicator"),
});

export const ImportIndicatorsSchema = z.object({
  indicators: z
    .array(
      z.object({
        indicatorValue: z.string(),
        indicatorType: z.enum([
          "FileSha1",
          "FileSha256",
          "FileMd5",
          "CertificateThumbprint",
          "IpAddress",
          "DomainName",
          "Url",
        ]),
        action: z.enum([
          "Warn",
          "Block",
          "Audit",
          "Alert",
          "AlertAndBlock",
          "BlockAndRemediate",
          "Allowed",
        ]),
        title: z.string(),
        description: z.string().optional(),
        severity: z.enum(["Informational", "Low", "Medium", "High"]).optional(),
        expirationTime: z.string().optional(),
      })
    )
    .describe("Array of indicators to import (max 500)"),
});

export const DeleteIndicatorSchema = z.object({
  indicatorId: z.string().describe("The unique ID of the indicator to delete"),
});

export const BatchDeleteIndicatorsSchema = z.object({
  indicatorIds: z.array(z.string()).describe("Array of indicator IDs to delete"),
});

// Tool implementations
export async function getIndicators(params: z.infer<typeof GetIndicatorsSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;
  if (params.skip) queryParams.$skip = params.skip;

  return defenderApiRequest("/indicators", { queryParams });
}

export async function createIndicator(params: z.infer<typeof CreateIndicatorSchema>) {
  return defenderApiRequest("/indicators", {
    method: "POST",
    body: params,
  });
}

export async function importIndicators(params: z.infer<typeof ImportIndicatorsSchema>) {
  return defenderApiRequest("/indicators/import", {
    method: "POST",
    body: { Indicators: params.indicators },
  });
}

export async function deleteIndicator(params: z.infer<typeof DeleteIndicatorSchema>) {
  return defenderApiRequest(`/indicators/${params.indicatorId}`, {
    method: "DELETE",
  });
}

export async function batchDeleteIndicators(params: z.infer<typeof BatchDeleteIndicatorsSchema>) {
  return defenderApiRequest("/indicators/batchDelete", {
    method: "POST",
    body: { IndicatorIds: params.indicatorIds },
  });
}

// Tool definitions for MCP
export const indicatorTools = [
  {
    name: "defender_get_indicators",
    description:
      "Get threat intelligence indicators (IoCs) from Microsoft Defender for Endpoint. Indicators can be file hashes, IPs, domains, or URLs.",
    inputSchema: GetIndicatorsSchema,
    handler: getIndicators,
  },
  {
    name: "defender_create_indicator",
    description:
      "Create a new threat intelligence indicator (IoC). Supports file hashes (SHA1, SHA256, MD5), certificate thumbprints, IP addresses, domains, and URLs. SECURITY ACTION: Requires authorization.",
    inputSchema: CreateIndicatorSchema,
    handler: createIndicator,
  },
  {
    name: "defender_import_indicators",
    description:
      "Batch import multiple threat intelligence indicators (up to 500 at once). SECURITY ACTION: Requires authorization.",
    inputSchema: ImportIndicatorsSchema,
    handler: importIndicators,
  },
  {
    name: "defender_delete_indicator",
    description:
      "Delete a specific threat intelligence indicator by its ID. SECURITY ACTION: Requires authorization.",
    inputSchema: DeleteIndicatorSchema,
    handler: deleteIndicator,
  },
  {
    name: "defender_batch_delete_indicators",
    description:
      "Batch delete multiple threat intelligence indicators. SECURITY ACTION: Requires authorization.",
    inputSchema: BatchDeleteIndicatorsSchema,
    handler: batchDeleteIndicators,
  },
];

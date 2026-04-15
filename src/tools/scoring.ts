import { z } from "zod";
import { defenderApiRequest } from "../api-client.js";

// Schema definitions
export const GetExposureScoreSchema = z.object({});

export const GetSecureScoreSchema = z.object({});

export const GetMachineGroupExposureScoreSchema = z.object({});

export const GetDeviceHealthSchema = z.object({
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().optional().describe("Maximum number of entries to return"),
});

export const ExportAntivirusHealthSchema = z.object({});

// Tool implementations
export async function getExposureScore(_params: z.infer<typeof GetExposureScoreSchema>) {
  return defenderApiRequest("/exposureScore", { useWdatp: true });
}

export async function getSecureScore(_params: z.infer<typeof GetSecureScoreSchema>) {
  return defenderApiRequest("/configurationScore", { useWdatp: true });
}

export async function getMachineGroupExposureScore(
  _params: z.infer<typeof GetMachineGroupExposureScoreSchema>
) {
  return defenderApiRequest("/exposureScore/byMachineGroups", { useWdatp: true });
}

export async function getDeviceHealth(params: z.infer<typeof GetDeviceHealthSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;

  return defenderApiRequest("/devicehealth/antivirus", { queryParams, useWdatp: true });
}

export async function exportAntivirusHealth(
  _params: z.infer<typeof ExportAntivirusHealthSchema>
) {
  return defenderApiRequest("/devicehealth/antivirus/export", { useWdatp: true });
}

// Tool definitions for MCP
export const scoringTools = [
  {
    name: "defender_get_exposure_score",
    description:
      "Get the organization's overall exposure score. A lower score indicates better security posture.",
    inputSchema: GetExposureScoreSchema,
    handler: getExposureScore,
  },
  {
    name: "defender_get_secure_score",
    description:
      "Get the organization's Microsoft Secure Score for devices. A higher score indicates better security configuration.",
    inputSchema: GetSecureScoreSchema,
    handler: getSecureScore,
  },
  {
    name: "defender_get_machine_group_exposure_score",
    description:
      "Get exposure scores broken down by machine groups for granular security posture visibility.",
    inputSchema: GetMachineGroupExposureScoreSchema,
    handler: getMachineGroupExposureScore,
  },
  {
    name: "defender_get_device_health",
    description:
      "Get antivirus health status for devices including definition versions, engine versions, and scan status.",
    inputSchema: GetDeviceHealthSchema,
    handler: getDeviceHealth,
  },
  {
    name: "defender_export_antivirus_health",
    description:
      "Export a detailed antivirus health report for all devices in the organization.",
    inputSchema: ExportAntivirusHealthSchema,
    handler: exportAntivirusHealth,
  },
];

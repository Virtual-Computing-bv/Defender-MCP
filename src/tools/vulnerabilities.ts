import { z } from "zod";
import { defenderApiRequest } from "../api-client.js";

// Schema definitions
export const GetVulnerabilitiesSchema = z.object({
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().optional().describe("Maximum number of vulnerabilities to return"),
  skip: z.number().optional().describe("Number of entries to skip"),
});

export const GetVulnerabilityByIdSchema = z.object({
  cveId: z.string().describe("The CVE ID (e.g., CVE-2020-1234)"),
});

export const GetMachineVulnerabilitiesSchema = z.object({
  machineId: z.string().describe("The unique ID of the machine"),
});

export const GetMachinesByVulnerabilitySchema = z.object({
  cveId: z.string().describe("The CVE ID to search for"),
});

export const GetSoftwareSchema = z.object({
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().optional().describe("Maximum number of software entries to return"),
  skip: z.number().optional().describe("Number of entries to skip"),
});

export const GetSoftwareByIdSchema = z.object({
  softwareId: z.string().describe("The unique ID of the software"),
});

export const GetSoftwareVulnerabilitiesSchema = z.object({
  softwareId: z.string().describe("The unique ID of the software"),
});

export const GetMachinesBySoftwareSchema = z.object({
  softwareId: z.string().describe("The unique ID of the software"),
});

export const GetSoftwareVersionDistributionSchema = z.object({
  softwareId: z.string().describe("The unique ID of the software"),
});

export const GetRecommendationsSchema = z.object({
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().optional().describe("Maximum number of recommendations to return"),
  skip: z.number().optional().describe("Number of entries to skip"),
});

export const GetRecommendationByIdSchema = z.object({
  recommendationId: z.string().describe("The unique ID of the recommendation"),
});

export const GetRecommendationMachinesSchema = z.object({
  recommendationId: z.string().describe("The unique ID of the recommendation"),
});

export const GetRecommendationVulnerabilitiesSchema = z.object({
  recommendationId: z.string().describe("The unique ID of the recommendation"),
});

export const GetRemediationActivitiesSchema = z.object({
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().optional().describe("Maximum number of activities to return"),
});

export const GetRemediationActivityByIdSchema = z.object({
  activityId: z.string().describe("The unique ID of the remediation activity"),
});

export const GetRemediationExposedDevicesSchema = z.object({
  activityId: z.string().describe("The unique ID of the remediation activity"),
});

export const ExportAssessmentSchema = z.object({
  assessmentType: z
    .enum([
      "softwareInventory",
      "softwareVulnerabilities",
      "secureConfiguration",
      "browserExtensions",
    ])
    .describe("Type of assessment to export"),
});

// Tool implementations
export async function getVulnerabilities(params: z.infer<typeof GetVulnerabilitiesSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;
  if (params.skip) queryParams.$skip = params.skip;

  return defenderApiRequest("/vulnerabilities", { queryParams });
}

export async function getVulnerabilityById(params: z.infer<typeof GetVulnerabilityByIdSchema>) {
  return defenderApiRequest(`/vulnerabilities/${params.cveId}`);
}

export async function getMachineVulnerabilities(
  params: z.infer<typeof GetMachineVulnerabilitiesSchema>
) {
  return defenderApiRequest(`/machines/${params.machineId}/vulnerabilities`);
}

export async function getMachinesByVulnerability(
  params: z.infer<typeof GetMachinesByVulnerabilitySchema>
) {
  return defenderApiRequest(`/vulnerabilities/${params.cveId}/machineReferences`);
}

export async function getSoftware(params: z.infer<typeof GetSoftwareSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;
  if (params.skip) queryParams.$skip = params.skip;

  return defenderApiRequest("/software", { queryParams });
}

export async function getSoftwareById(params: z.infer<typeof GetSoftwareByIdSchema>) {
  return defenderApiRequest(`/software/${params.softwareId}`);
}

export async function getSoftwareVulnerabilities(
  params: z.infer<typeof GetSoftwareVulnerabilitiesSchema>
) {
  return defenderApiRequest(`/software/${params.softwareId}/vulnerabilities`);
}

export async function getMachinesBySoftware(params: z.infer<typeof GetMachinesBySoftwareSchema>) {
  return defenderApiRequest(`/software/${params.softwareId}/machineReferences`);
}

export async function getSoftwareVersionDistribution(
  params: z.infer<typeof GetSoftwareVersionDistributionSchema>
) {
  return defenderApiRequest(`/software/${params.softwareId}/distributions`);
}

export async function getRecommendations(params: z.infer<typeof GetRecommendationsSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;
  if (params.skip) queryParams.$skip = params.skip;

  return defenderApiRequest("/recommendations", { queryParams });
}

export async function getRecommendationById(params: z.infer<typeof GetRecommendationByIdSchema>) {
  return defenderApiRequest(`/recommendations/${params.recommendationId}`);
}

export async function getRecommendationMachines(
  params: z.infer<typeof GetRecommendationMachinesSchema>
) {
  return defenderApiRequest(`/recommendations/${params.recommendationId}/machineReferences`);
}

export async function getRecommendationVulnerabilities(
  params: z.infer<typeof GetRecommendationVulnerabilitiesSchema>
) {
  return defenderApiRequest(`/recommendations/${params.recommendationId}/vulnerabilities`);
}

export async function getRemediationActivities(
  params: z.infer<typeof GetRemediationActivitiesSchema>
) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;

  return defenderApiRequest("/remediationTasks", { queryParams });
}

export async function getRemediationActivityById(
  params: z.infer<typeof GetRemediationActivityByIdSchema>
) {
  return defenderApiRequest(`/remediationTasks/${params.activityId}`);
}

export async function getRemediationExposedDevices(
  params: z.infer<typeof GetRemediationExposedDevicesSchema>
) {
  return defenderApiRequest(`/remediationTasks/${params.activityId}/machineReferences`);
}

export async function exportAssessment(params: z.infer<typeof ExportAssessmentSchema>) {
  const endpoints: Record<string, string> = {
    softwareInventory: "/machines/SoftwareInventoryByMachine",
    softwareVulnerabilities: "/machines/SoftwareVulnerabilitiesByMachine",
    secureConfiguration: "/machines/SecureConfigurationAssessmentByMachine",
    browserExtensions: "/machines/BrowserExtensionsInventoryByMachine",
  };

  return defenderApiRequest(endpoints[params.assessmentType]);
}

// Tool definitions for MCP
export const vulnerabilityTools = [
  {
    name: "defender_get_vulnerabilities",
    description:
      "Get a list of all known vulnerabilities in the organization from Microsoft Defender for Endpoint.",
    inputSchema: GetVulnerabilitiesSchema,
    handler: getVulnerabilities,
  },
  {
    name: "defender_get_vulnerability_by_id",
    description: "Get detailed information about a specific vulnerability by its CVE ID.",
    inputSchema: GetVulnerabilityByIdSchema,
    handler: getVulnerabilityById,
  },
  {
    name: "defender_get_machine_vulnerabilities",
    description: "Get all vulnerabilities affecting a specific machine.",
    inputSchema: GetMachineVulnerabilitiesSchema,
    handler: getMachineVulnerabilities,
  },
  {
    name: "defender_get_machines_by_vulnerability",
    description: "Get all machines affected by a specific vulnerability (CVE).",
    inputSchema: GetMachinesByVulnerabilitySchema,
    handler: getMachinesByVulnerability,
  },
  {
    name: "defender_get_software",
    description:
      "Get a list of software inventory from Microsoft Defender for Endpoint with filtering support.",
    inputSchema: GetSoftwareSchema,
    handler: getSoftware,
  },
  {
    name: "defender_get_software_by_id",
    description: "Get detailed information about a specific software by its ID.",
    inputSchema: GetSoftwareByIdSchema,
    handler: getSoftwareById,
  },
  {
    name: "defender_get_software_vulnerabilities",
    description: "Get all known vulnerabilities for a specific software.",
    inputSchema: GetSoftwareVulnerabilitiesSchema,
    handler: getSoftwareVulnerabilities,
  },
  {
    name: "defender_get_machines_by_software",
    description: "Get all machines that have a specific software installed.",
    inputSchema: GetMachinesBySoftwareSchema,
    handler: getMachinesBySoftware,
  },
  {
    name: "defender_get_software_version_distribution",
    description: "Get the version distribution for a specific software across the organization.",
    inputSchema: GetSoftwareVersionDistributionSchema,
    handler: getSoftwareVersionDistribution,
  },
  {
    name: "defender_get_recommendations",
    description:
      "Get security recommendations from Microsoft Defender Vulnerability Management.",
    inputSchema: GetRecommendationsSchema,
    handler: getRecommendations,
  },
  {
    name: "defender_get_recommendation_by_id",
    description: "Get a specific security recommendation by its ID.",
    inputSchema: GetRecommendationByIdSchema,
    handler: getRecommendationById,
  },
  {
    name: "defender_get_recommendation_machines",
    description: "Get all machines affected by a specific security recommendation.",
    inputSchema: GetRecommendationMachinesSchema,
    handler: getRecommendationMachines,
  },
  {
    name: "defender_get_recommendation_vulnerabilities",
    description: "Get all vulnerabilities related to a specific recommendation.",
    inputSchema: GetRecommendationVulnerabilitiesSchema,
    handler: getRecommendationVulnerabilities,
  },
  {
    name: "defender_get_remediation_activities",
    description: "Get all remediation activities in the organization.",
    inputSchema: GetRemediationActivitiesSchema,
    handler: getRemediationActivities,
  },
  {
    name: "defender_get_remediation_activity_by_id",
    description: "Get a specific remediation activity by its ID.",
    inputSchema: GetRemediationActivityByIdSchema,
    handler: getRemediationActivityById,
  },
  {
    name: "defender_get_remediation_exposed_devices",
    description: "Get all devices exposed and targeted by a remediation activity.",
    inputSchema: GetRemediationExposedDevicesSchema,
    handler: getRemediationExposedDevices,
  },
  {
    name: "defender_export_assessment",
    description:
      "Export assessment data per device. Available types: softwareInventory, softwareVulnerabilities, secureConfiguration, browserExtensions.",
    inputSchema: ExportAssessmentSchema,
    handler: exportAssessment,
  },
];

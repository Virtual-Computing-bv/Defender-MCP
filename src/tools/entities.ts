import { z } from "zod";
import { defenderApiRequest } from "../api-client.js";

// File-related schemas
export const GetFileInfoSchema = z.object({
  fileHash: z.string().describe("SHA1 or SHA256 hash of the file"),
});

export const GetFileAlertsSchema = z.object({
  fileHash: z.string().describe("SHA1 or SHA256 hash of the file"),
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().optional().describe("Maximum number of alerts to return"),
});

export const GetFileMachinesSchema = z.object({
  fileHash: z.string().describe("SHA1 or SHA256 hash of the file"),
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().optional().describe("Maximum number of machines to return"),
});

export const GetFileStatisticsSchema = z.object({
  fileHash: z.string().describe("SHA1 or SHA256 hash of the file"),
});

// Domain-related schemas
export const GetDomainAlertsSchema = z.object({
  domain: z.string().describe("Domain name"),
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().optional().describe("Maximum number of alerts to return"),
});

export const GetDomainMachinesSchema = z.object({
  domain: z.string().describe("Domain name"),
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().optional().describe("Maximum number of machines to return"),
});

export const GetDomainStatisticsSchema = z.object({
  domain: z.string().describe("Domain name"),
});

// IP-related schemas
export const GetIpAlertsSchema = z.object({
  ip: z.string().describe("IP address"),
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().optional().describe("Maximum number of alerts to return"),
});

export const GetIpStatisticsSchema = z.object({
  ip: z.string().describe("IP address"),
});

// User-related schemas
export const GetUserAlertsSchema = z.object({
  userId: z.string().describe("User ID (domain\\username or UPN)"),
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().optional().describe("Maximum number of alerts to return"),
});

export const GetUserMachinesSchema = z.object({
  userId: z.string().describe("User ID (domain\\username or UPN)"),
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().optional().describe("Maximum number of machines to return"),
});

// Tool implementations
export async function getFileInfo(params: z.infer<typeof GetFileInfoSchema>) {
  return defenderApiRequest(`/files/${params.fileHash}`, { useWdatp: true });
}

export async function getFileAlerts(params: z.infer<typeof GetFileAlertsSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;

  return defenderApiRequest(`/files/${params.fileHash}/alerts`, { queryParams, useWdatp: true });
}

export async function getFileMachines(params: z.infer<typeof GetFileMachinesSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;

  return defenderApiRequest(`/files/${params.fileHash}/machines`, { queryParams, useWdatp: true });
}

export async function getFileStatistics(params: z.infer<typeof GetFileStatisticsSchema>) {
  return defenderApiRequest(`/files/${params.fileHash}/stats`, { useWdatp: true });
}

export async function getDomainAlerts(params: z.infer<typeof GetDomainAlertsSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;

  return defenderApiRequest(`/domains/${params.domain}/alerts`, { queryParams, useWdatp: true });
}

export async function getDomainMachines(params: z.infer<typeof GetDomainMachinesSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;

  return defenderApiRequest(`/domains/${params.domain}/machines`, { queryParams, useWdatp: true });
}

export async function getDomainStatistics(params: z.infer<typeof GetDomainStatisticsSchema>) {
  return defenderApiRequest(`/domains/${params.domain}/stats`, { useWdatp: true });
}

export async function getIpAlerts(params: z.infer<typeof GetIpAlertsSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;

  return defenderApiRequest(`/ips/${params.ip}/alerts`, { queryParams, useWdatp: true });
}

export async function getIpStatistics(params: z.infer<typeof GetIpStatisticsSchema>) {
  return defenderApiRequest(`/ips/${params.ip}/stats`, { useWdatp: true });
}

export async function getUserAlerts(params: z.infer<typeof GetUserAlertsSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;

  return defenderApiRequest(`/users/${encodeURIComponent(params.userId)}/alerts`, { queryParams, useWdatp: true });
}

export async function getUserMachines(params: z.infer<typeof GetUserMachinesSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;

  return defenderApiRequest(`/users/${encodeURIComponent(params.userId)}/machines`, {
    queryParams,
    useWdatp: true,
  });
}

// Tool definitions for MCP
export const entityTools = [
  // File tools
  {
    name: "defender_get_file_info",
    description:
      "Get information about a file by its SHA1 or SHA256 hash, including prevalence and global statistics.",
    inputSchema: GetFileInfoSchema,
    handler: getFileInfo,
  },
  {
    name: "defender_get_file_alerts",
    description: "Get all alerts related to a specific file (by hash).",
    inputSchema: GetFileAlertsSchema,
    handler: getFileAlerts,
  },
  {
    name: "defender_get_file_machines",
    description: "Get all machines where a specific file (by hash) has been observed.",
    inputSchema: GetFileMachinesSchema,
    handler: getFileMachines,
  },
  {
    name: "defender_get_file_statistics",
    description:
      "Get statistics for a file including organization prevalence and worldwide prevalence.",
    inputSchema: GetFileStatisticsSchema,
    handler: getFileStatistics,
  },
  // Domain tools
  {
    name: "defender_get_domain_alerts",
    description: "Get all alerts related to a specific domain.",
    inputSchema: GetDomainAlertsSchema,
    handler: getDomainAlerts,
  },
  {
    name: "defender_get_domain_machines",
    description: "Get all machines that have communicated with a specific domain.",
    inputSchema: GetDomainMachinesSchema,
    handler: getDomainMachines,
  },
  {
    name: "defender_get_domain_statistics",
    description: "Get statistics for a domain including prevalence information.",
    inputSchema: GetDomainStatisticsSchema,
    handler: getDomainStatistics,
  },
  // IP tools
  {
    name: "defender_get_ip_alerts",
    description: "Get all alerts related to a specific IP address.",
    inputSchema: GetIpAlertsSchema,
    handler: getIpAlerts,
  },
  {
    name: "defender_get_ip_statistics",
    description: "Get statistics for an IP address including prevalence and geolocation.",
    inputSchema: GetIpStatisticsSchema,
    handler: getIpStatistics,
  },
  // User tools
  {
    name: "defender_get_user_alerts",
    description:
      "Get all alerts related to a specific user. User ID can be domain\\username or UPN format.",
    inputSchema: GetUserAlertsSchema,
    handler: getUserAlerts,
  },
  {
    name: "defender_get_user_machines",
    description:
      "Get all machines associated with a specific user (machines the user has logged into).",
    inputSchema: GetUserMachinesSchema,
    handler: getUserMachines,
  },
];

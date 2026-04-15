import { z } from "zod";
import { defenderApiRequest } from "../api-client.js";

// Schema definitions
export const GetMachinesSchema = z.object({
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().optional().describe("Maximum number of machines to return"),
  skip: z.number().optional().describe("Number of entries to skip"),
  orderby: z.string().optional().describe("Order by property"),
});

export const GetMachineByIdSchema = z.object({
  machineId: z.string().describe("The unique ID of the machine"),
});

export const FindMachinesByIpSchema = z.object({
  ip: z.string().describe("IP address to search for"),
  timestamp: z.string().describe("ISO 8601 timestamp for the lookup time range"),
});

export const FindMachinesByTagSchema = z.object({
  tag: z.string().describe("Machine tag to search for"),
});

export const UpdateMachineSchema = z.object({
  machineId: z.string().describe("The unique ID of the machine"),
  machineTags: z.array(z.string()).optional().describe("New machine tags"),
  deviceValue: z.enum(["Low", "Normal", "High"]).optional().describe("Device value/importance"),
});

export const AddRemoveMachineTagSchema = z.object({
  machineId: z.string().describe("The unique ID of the machine"),
  value: z.string().describe("Tag value to add or remove"),
  action: z.enum(["Add", "Remove"]).describe("Action to perform"),
});

export const GetMachineLogonUsersSchema = z.object({
  machineId: z.string().describe("The unique ID of the machine"),
});

export const GetMachineAlertsSchema = z.object({
  machineId: z.string().describe("The unique ID of the machine"),
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().optional().describe("Maximum number of alerts to return"),
});

export const IsolateMachineSchema = z.object({
  machineId: z.string().describe("The unique ID of the machine to isolate"),
  comment: z.string().describe("Comment explaining the reason for isolation"),
  isolationType: z.enum(["Full", "Selective"]).describe("Type of isolation to apply"),
});

export const UnisolateMachineSchema = z.object({
  machineId: z.string().describe("The unique ID of the machine to unisolate"),
  comment: z.string().describe("Comment explaining the reason for release from isolation"),
});

export const RunAvScanSchema = z.object({
  machineId: z.string().describe("The unique ID of the machine"),
  comment: z.string().describe("Comment explaining the reason for the scan"),
  scanType: z.enum(["Quick", "Full"]).describe("Type of antivirus scan to run"),
});

export const RestrictCodeExecutionSchema = z.object({
  machineId: z.string().describe("The unique ID of the machine"),
  comment: z.string().describe("Comment explaining the reason for restriction"),
});

export const UnrestrictCodeExecutionSchema = z.object({
  machineId: z.string().describe("The unique ID of the machine"),
  comment: z.string().describe("Comment explaining the reason for removing restriction"),
});

export const StopAndQuarantineFileSchema = z.object({
  machineId: z.string().describe("The unique ID of the machine"),
  comment: z.string().describe("Comment explaining the reason"),
  sha1: z.string().describe("SHA1 hash of the file to stop and quarantine"),
});

export const CollectInvestigationPackageSchema = z.object({
  machineId: z.string().describe("The unique ID of the machine"),
  comment: z.string().describe("Comment explaining the reason for collection"),
});

export const OffboardMachineSchema = z.object({
  machineId: z.string().describe("The unique ID of the machine to offboard"),
  comment: z.string().describe("Comment explaining the reason for offboarding"),
});

// Tool implementations
export async function getMachines(params: z.infer<typeof GetMachinesSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;
  if (params.skip) queryParams.$skip = params.skip;
  if (params.orderby) queryParams.$orderby = params.orderby;

  return defenderApiRequest("/machines", { queryParams, useWdatp: true });
}

export async function getMachineById(params: z.infer<typeof GetMachineByIdSchema>) {
  return defenderApiRequest(`/machines/${params.machineId}`, { useWdatp: true });
}

export async function findMachinesByIp(params: z.infer<typeof FindMachinesByIpSchema>) {
  return defenderApiRequest(`/machines/findbyip(ip='${params.ip}',timestamp=${params.timestamp})`, { useWdatp: true });
}

export async function findMachinesByTag(params: z.infer<typeof FindMachinesByTagSchema>) {
  return defenderApiRequest(`/machines/findbytag`, {
    method: "POST",
    body: { Value: params.tag },
    useWdatp: true,
  });
}

export async function updateMachine(params: z.infer<typeof UpdateMachineSchema>) {
  const { machineId, ...body } = params;
  return defenderApiRequest(`/machines/${machineId}`, {
    method: "PATCH",
    body,
    useWdatp: true,
  });
}

export async function addRemoveMachineTag(params: z.infer<typeof AddRemoveMachineTagSchema>) {
  const { machineId, ...body } = params;
  return defenderApiRequest(`/machines/${machineId}/tags`, {
    method: "POST",
    body: { Value: body.value, Action: body.action },
    useWdatp: true,
  });
}

export async function getMachineLogonUsers(params: z.infer<typeof GetMachineLogonUsersSchema>) {
  return defenderApiRequest(`/machines/${params.machineId}/logonusers`, { useWdatp: true });
}

export async function getMachineAlerts(params: z.infer<typeof GetMachineAlertsSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;

  return defenderApiRequest(`/machines/${params.machineId}/alerts`, { queryParams, useWdatp: true });
}

export async function isolateMachine(params: z.infer<typeof IsolateMachineSchema>) {
  const { machineId, ...body } = params;
  return defenderApiRequest(`/machines/${machineId}/isolate`, {
    method: "POST",
    body: { Comment: body.comment, IsolationType: body.isolationType },
    useWdatp: true,
  });
}

export async function unisolateMachine(params: z.infer<typeof UnisolateMachineSchema>) {
  const { machineId, ...body } = params;
  return defenderApiRequest(`/machines/${machineId}/unisolate`, {
    method: "POST",
    body: { Comment: body.comment },
    useWdatp: true,
  });
}

export async function runAvScan(params: z.infer<typeof RunAvScanSchema>) {
  const { machineId, ...body } = params;
  return defenderApiRequest(`/machines/${machineId}/runAntiVirusScan`, {
    method: "POST",
    body: { Comment: body.comment, ScanType: body.scanType },
    useWdatp: true,
  });
}

export async function restrictCodeExecution(params: z.infer<typeof RestrictCodeExecutionSchema>) {
  const { machineId, ...body } = params;
  return defenderApiRequest(`/machines/${machineId}/restrictCodeExecution`, {
    method: "POST",
    body: { Comment: body.comment },
    useWdatp: true,
  });
}

export async function unrestrictCodeExecution(
  params: z.infer<typeof UnrestrictCodeExecutionSchema>
) {
  const { machineId, ...body } = params;
  return defenderApiRequest(`/machines/${machineId}/unrestrictCodeExecution`, {
    method: "POST",
    body: { Comment: body.comment },
    useWdatp: true,
  });
}

export async function stopAndQuarantineFile(params: z.infer<typeof StopAndQuarantineFileSchema>) {
  const { machineId, ...body } = params;
  return defenderApiRequest(`/machines/${machineId}/StopAndQuarantineFile`, {
    method: "POST",
    body: { Comment: body.comment, Sha1: body.sha1 },
    useWdatp: true,
  });
}

export async function collectInvestigationPackage(
  params: z.infer<typeof CollectInvestigationPackageSchema>
) {
  const { machineId, ...body } = params;
  return defenderApiRequest(`/machines/${machineId}/collectInvestigationPackage`, {
    method: "POST",
    body: { Comment: body.comment },
    useWdatp: true,
  });
}

export async function offboardMachine(params: z.infer<typeof OffboardMachineSchema>) {
  const { machineId, ...body } = params;
  return defenderApiRequest(`/machines/${machineId}/offboard`, {
    method: "POST",
    body: { Comment: body.comment },
    useWdatp: true,
  });
}

// Tool definitions for MCP
export const machineTools = [
  {
    name: "defender_get_machines",
    description:
      "Get a list of machines/devices from Microsoft Defender for Endpoint with filtering, pagination and sorting support.",
    inputSchema: GetMachinesSchema,
    handler: getMachines,
  },
  {
    name: "defender_get_machine_by_id",
    description: "Get detailed information about a specific machine by its unique ID.",
    inputSchema: GetMachineByIdSchema,
    handler: getMachineById,
  },
  {
    name: "defender_find_machines_by_ip",
    description: "Find machines that had a specific IP address at a given timestamp.",
    inputSchema: FindMachinesByIpSchema,
    handler: findMachinesByIp,
  },
  {
    name: "defender_find_machines_by_tag",
    description: "Find machines that have a specific tag assigned.",
    inputSchema: FindMachinesByTagSchema,
    handler: findMachinesByTag,
  },
  {
    name: "defender_update_machine",
    description: "Update machine properties like tags or device value/importance.",
    inputSchema: UpdateMachineSchema,
    handler: updateMachine,
  },
  {
    name: "defender_add_remove_machine_tag",
    description: "Add or remove a tag from a specific machine.",
    inputSchema: AddRemoveMachineTagSchema,
    handler: addRemoveMachineTag,
  },
  {
    name: "defender_get_machine_logon_users",
    description: "Get the list of users that have logged onto a specific machine.",
    inputSchema: GetMachineLogonUsersSchema,
    handler: getMachineLogonUsers,
  },
  {
    name: "defender_get_machine_alerts",
    description: "Get alerts associated with a specific machine.",
    inputSchema: GetMachineAlertsSchema,
    handler: getMachineAlerts,
  },
  {
    name: "defender_isolate_machine",
    description:
      "Isolate a machine from the network. Use Full isolation to completely disconnect or Selective for limited access. SECURITY ACTION: Requires authorization.",
    inputSchema: IsolateMachineSchema,
    handler: isolateMachine,
  },
  {
    name: "defender_unisolate_machine",
    description:
      "Release a machine from network isolation, restoring its network connectivity. SECURITY ACTION: Requires authorization.",
    inputSchema: UnisolateMachineSchema,
    handler: unisolateMachine,
  },
  {
    name: "defender_run_av_scan",
    description:
      "Trigger an antivirus scan on a machine. Quick scan checks common malware locations, Full scan checks entire system. SECURITY ACTION.",
    inputSchema: RunAvScanSchema,
    handler: runAvScan,
  },
  {
    name: "defender_restrict_code_execution",
    description:
      "Restrict application execution on a machine to only Microsoft-signed binaries. SECURITY ACTION: Requires authorization.",
    inputSchema: RestrictCodeExecutionSchema,
    handler: restrictCodeExecution,
  },
  {
    name: "defender_unrestrict_code_execution",
    description:
      "Remove application execution restrictions from a machine. SECURITY ACTION: Requires authorization.",
    inputSchema: UnrestrictCodeExecutionSchema,
    handler: unrestrictCodeExecution,
  },
  {
    name: "defender_stop_and_quarantine_file",
    description:
      "Stop execution of a file and quarantine it on a specific machine. Requires the SHA1 hash of the file. SECURITY ACTION: Requires authorization.",
    inputSchema: StopAndQuarantineFileSchema,
    handler: stopAndQuarantineFile,
  },
  {
    name: "defender_collect_investigation_package",
    description:
      "Collect a forensic investigation package from a machine containing logs, registry data, and other forensic artifacts.",
    inputSchema: CollectInvestigationPackageSchema,
    handler: collectInvestigationPackage,
  },
  {
    name: "defender_offboard_machine",
    description:
      "Offboard a machine from Microsoft Defender for Endpoint. WARNING: This is a significant action that removes protection. SECURITY ACTION: Requires authorization.",
    inputSchema: OffboardMachineSchema,
    handler: offboardMachine,
  },
];

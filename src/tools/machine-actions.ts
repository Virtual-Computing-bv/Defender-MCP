import { z } from "zod";
import { defenderApiRequest } from "../api-client.js";

// Schema definitions
export const GetMachineActionsSchema = z.object({
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().optional().describe("Maximum number of actions to return"),
  skip: z.number().optional().describe("Number of entries to skip"),
});

export const GetMachineActionByIdSchema = z.object({
  actionId: z.string().describe("The unique ID of the machine action"),
});

export const CancelMachineActionSchema = z.object({
  actionId: z.string().describe("The unique ID of the machine action to cancel"),
  comment: z.string().describe("Comment explaining why the action is being cancelled"),
});

export const GetPackageSasUriSchema = z.object({
  actionId: z.string().describe("The unique ID of the collect investigation package action"),
});

export const RunLiveResponseSchema = z.object({
  machineId: z.string().describe("The unique ID of the machine"),
  commands: z
    .array(
      z.object({
        type: z
          .enum(["RunScript", "GetFile", "PutFile"])
          .describe("Type of live response command"),
        params: z
          .array(
            z.object({
              key: z.string(),
              value: z.string(),
            })
          )
          .describe("Command parameters"),
      })
    )
    .describe("Array of live response commands to execute"),
  comment: z.string().describe("Comment explaining the reason for the live response session"),
});

export const GetLiveResponseResultSchema = z.object({
  machineId: z.string().describe("The unique ID of the machine"),
  actionId: z.string().describe("The unique ID of the live response action"),
  commandIndex: z.number().describe("Index of the command (0-based)"),
});

export const GetInvestigationsSchema = z.object({
  filter: z.string().optional().describe("OData filter expression"),
  top: z.number().optional().describe("Maximum number of investigations to return"),
  skip: z.number().optional().describe("Number of entries to skip"),
});

export const GetInvestigationByIdSchema = z.object({
  investigationId: z.string().describe("The unique ID of the investigation"),
});

export const StartInvestigationSchema = z.object({
  machineId: z.string().describe("The unique ID of the machine to investigate"),
  comment: z.string().describe("Comment explaining the reason for the investigation"),
});

export const UploadLibraryFileSchema = z.object({
  file: z.string().describe("Base64 encoded file content"),
  fileName: z.string().describe("Name of the file"),
  description: z.string().optional().describe("Description of the file"),
  hasParameters: z.boolean().optional().describe("Whether the script has parameters"),
  overrideIfExists: z.boolean().optional().describe("Whether to override if file exists"),
});

export const DeleteLibraryFileSchema = z.object({
  fileName: z.string().describe("Name of the file to delete"),
});

export const ListLibraryFilesSchema = z.object({});

// Tool implementations
export async function getMachineActions(params: z.infer<typeof GetMachineActionsSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;
  if (params.skip) queryParams.$skip = params.skip;

  return defenderApiRequest("/machineactions", { queryParams });
}

export async function getMachineActionById(params: z.infer<typeof GetMachineActionByIdSchema>) {
  return defenderApiRequest(`/machineactions/${params.actionId}`);
}

export async function cancelMachineAction(params: z.infer<typeof CancelMachineActionSchema>) {
  return defenderApiRequest(`/machineactions/${params.actionId}/cancel`, {
    method: "POST",
    body: { Comment: params.comment },
  });
}

export async function getPackageSasUri(params: z.infer<typeof GetPackageSasUriSchema>) {
  return defenderApiRequest(`/machineactions/${params.actionId}/getPackageUri`);
}

export async function runLiveResponse(params: z.infer<typeof RunLiveResponseSchema>) {
  const { machineId, ...body } = params;
  return defenderApiRequest(`/machines/${machineId}/runliveresponse`, {
    method: "POST",
    body: {
      Commands: body.commands,
      Comment: body.comment,
    },
  });
}

export async function getLiveResponseResult(params: z.infer<typeof GetLiveResponseResultSchema>) {
  return defenderApiRequest(
    `/machines/${params.machineId}/LiveResponseResultDownloadLink(actionId=${params.actionId},commandIndex=${params.commandIndex})`
  );
}

export async function getInvestigations(params: z.infer<typeof GetInvestigationsSchema>) {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.filter) queryParams.$filter = params.filter;
  if (params.top) queryParams.$top = params.top;
  if (params.skip) queryParams.$skip = params.skip;

  return defenderApiRequest("/investigations", { queryParams });
}

export async function getInvestigationById(params: z.infer<typeof GetInvestigationByIdSchema>) {
  return defenderApiRequest(`/investigations/${params.investigationId}`);
}

export async function startInvestigation(params: z.infer<typeof StartInvestigationSchema>) {
  const { machineId, ...body } = params;
  return defenderApiRequest(`/machines/${machineId}/startInvestigation`, {
    method: "POST",
    body: { Comment: body.comment },
  });
}

export async function uploadLibraryFile(params: z.infer<typeof UploadLibraryFileSchema>) {
  return defenderApiRequest("/libraryfiles", {
    method: "POST",
    body: params,
  });
}

export async function deleteLibraryFile(params: z.infer<typeof DeleteLibraryFileSchema>) {
  return defenderApiRequest(`/libraryfiles/${params.fileName}`, {
    method: "DELETE",
  });
}

export async function listLibraryFiles(_params: z.infer<typeof ListLibraryFilesSchema>) {
  return defenderApiRequest("/libraryfiles");
}

// Tool definitions for MCP
export const machineActionTools = [
  {
    name: "defender_get_machine_actions",
    description:
      "Get a list of machine actions (isolation, AV scan, etc.) with their status and details.",
    inputSchema: GetMachineActionsSchema,
    handler: getMachineActions,
  },
  {
    name: "defender_get_machine_action_by_id",
    description: "Get details of a specific machine action by its ID.",
    inputSchema: GetMachineActionByIdSchema,
    handler: getMachineActionById,
  },
  {
    name: "defender_cancel_machine_action",
    description:
      "Cancel a pending machine action. Only actions that are not yet completed can be cancelled.",
    inputSchema: CancelMachineActionSchema,
    handler: cancelMachineAction,
  },
  {
    name: "defender_get_package_sas_uri",
    description:
      "Get the SAS URI to download an investigation package after it has been collected.",
    inputSchema: GetPackageSasUriSchema,
    handler: getPackageSasUri,
  },
  {
    name: "defender_run_live_response",
    description:
      "Execute live response commands on a machine. Supports RunScript, GetFile, and PutFile operations. SECURITY ACTION: Requires authorization.",
    inputSchema: RunLiveResponseSchema,
    handler: runLiveResponse,
  },
  {
    name: "defender_get_live_response_result",
    description: "Get the download link for the result of a live response command.",
    inputSchema: GetLiveResponseResultSchema,
    handler: getLiveResponseResult,
  },
  {
    name: "defender_get_investigations",
    description: "Get a list of automated investigations with their status and findings.",
    inputSchema: GetInvestigationsSchema,
    handler: getInvestigations,
  },
  {
    name: "defender_get_investigation_by_id",
    description: "Get details of a specific automated investigation.",
    inputSchema: GetInvestigationByIdSchema,
    handler: getInvestigationById,
  },
  {
    name: "defender_start_investigation",
    description:
      "Start an automated investigation on a machine. SECURITY ACTION: Requires authorization.",
    inputSchema: StartInvestigationSchema,
    handler: startInvestigation,
  },
  {
    name: "defender_upload_library_file",
    description:
      "Upload a file (such as a remediation script) to the live response library. SECURITY ACTION: Requires authorization.",
    inputSchema: UploadLibraryFileSchema,
    handler: uploadLibraryFile,
  },
  {
    name: "defender_delete_library_file",
    description:
      "Delete a file from the live response library. SECURITY ACTION: Requires authorization.",
    inputSchema: DeleteLibraryFileSchema,
    handler: deleteLibraryFile,
  },
  {
    name: "defender_list_library_files",
    description: "List all files in the live response library.",
    inputSchema: ListLibraryFilesSchema,
    handler: listLibraryFiles,
  },
];

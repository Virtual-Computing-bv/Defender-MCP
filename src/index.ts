#!/usr/bin/env node

import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { initializeAuth, isAuthConfigured } from "./auth.js";
import { alertTools } from "./tools/alerts.js";
import { machineTools } from "./tools/machines.js";
import { vulnerabilityTools } from "./tools/vulnerabilities.js";
import { indicatorTools } from "./tools/indicators.js";
import { machineActionTools } from "./tools/machine-actions.js";
import { advancedHuntingTools } from "./tools/advanced-hunting.js";
import { entityTools } from "./tools/entities.js";
import { scoringTools } from "./tools/scoring.js";

// Collect all tools
const allToolDefinitions = [
  ...alertTools,
  ...machineTools,
  ...vulnerabilityTools,
  ...indicatorTools,
  ...machineActionTools,
  ...advancedHuntingTools,
  ...entityTools,
  ...scoringTools,
];

// Create a map for quick lookup
const toolHandlers = new Map<string, { schema: z.ZodType; handler: (params: unknown) => Promise<unknown> }>();

for (const tool of allToolDefinitions) {
  toolHandlers.set(tool.name, {
    schema: tool.inputSchema,
    handler: tool.handler as (params: unknown) => Promise<unknown>,
  });
}

// Convert Zod schemas to JSON Schema for MCP
function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const zodValue = value as z.ZodType;
      properties[key] = zodFieldToJsonSchema(zodValue);

      // Check if field is required (not optional)
      if (!(zodValue instanceof z.ZodOptional)) {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  return { type: "object" };
}

function zodFieldToJsonSchema(field: z.ZodType): Record<string, unknown> {
  // Handle optional types
  if (field instanceof z.ZodOptional) {
    return zodFieldToJsonSchema(field.unwrap());
  }

  // Handle string
  if (field instanceof z.ZodString) {
    return {
      type: "string",
      description: field.description,
    };
  }

  // Handle number
  if (field instanceof z.ZodNumber) {
    return {
      type: "number",
      description: field.description,
    };
  }

  // Handle boolean
  if (field instanceof z.ZodBoolean) {
    return {
      type: "boolean",
      description: field.description,
    };
  }

  // Handle enum
  if (field instanceof z.ZodEnum) {
    return {
      type: "string",
      enum: field.options,
      description: field.description,
    };
  }

  // Handle array
  if (field instanceof z.ZodArray) {
    return {
      type: "array",
      items: zodFieldToJsonSchema(field.element),
      description: field.description,
    };
  }

  // Handle object
  if (field instanceof z.ZodObject) {
    return {
      ...zodToJsonSchema(field),
      description: field.description,
    };
  }

  return { type: "string" };
}

// Create MCP server
const server = new Server(
  {
    name: "defender-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = allToolDefinitions.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: zodToJsonSchema(tool.inputSchema) as {
      type: "object";
      properties?: Record<string, object>;
      required?: string[];
    },
  }));

  return { tools };
});

// Handle call tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const toolDef = toolHandlers.get(name);
  if (!toolDef) {
    throw new Error(`Unknown tool: ${name}`);
  }

  // Check if authentication is configured
  if (!isAuthConfigured()) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: "Authentication not configured",
              message:
                "Please set the following environment variables: DEFENDER_TENANT_ID, DEFENDER_CLIENT_ID, DEFENDER_CLIENT_SECRET",
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }

  try {
    // Validate and parse arguments
    const parsedArgs = toolDef.schema.parse(args || {});

    // Execute the tool handler
    const result = await toolDef.handler(parsedArgs);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: "Tool execution failed",
              message: errorMessage,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Main entry point
async function main() {
  // Initialize authentication from environment variables
  const tenantId = process.env.DEFENDER_TENANT_ID;
  const clientId = process.env.DEFENDER_CLIENT_ID;
  const clientSecret = process.env.DEFENDER_CLIENT_SECRET;

  if (tenantId && clientId && clientSecret) {
    initializeAuth({
      tenantId,
      clientId,
      clientSecret,
    });
    console.error("Authentication initialized successfully");
  } else {
    console.error(
      "Warning: Authentication not configured. Set DEFENDER_TENANT_ID, DEFENDER_CLIENT_ID, and DEFENDER_CLIENT_SECRET environment variables."
    );
  }

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Microsoft Defender MCP Server started");
  console.error(`Loaded ${allToolDefinitions.length} tools`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

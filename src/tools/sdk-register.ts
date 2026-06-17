import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ALL_TOOL_DEFINITIONS,
  filterToolDefinitions,
  type ToolDefinition,
  type ToolRuntime,
} from "@andrewkimjoseph/celina-sdk/tools";
import type { AppContext } from "../context/app-context.js";
import { err, ok, okSelfSession } from "./helpers.js";
import { createMcpRuntime } from "./create-runtime.js";

export type RegisterToolsOptions = {
  serverKeyToolsEnabled?: boolean;
  selfSessionToolsEnabled?: boolean;
  estimateToolsEnabled?: boolean;
};

function registerDefinition(
  server: McpServer,
  runtime: ToolRuntime,
  definition: ToolDefinition,
): void {
  const { name, description, inputSchema, mcp } = definition;
  server.registerTool(
    name,
    {
      title: mcp?.title ?? name,
      description,
      inputSchema,
      annotations: mcp?.annotations,
    },
    async (input: Record<string, unknown>) => {
      try {
        const result = await definition.handler(runtime, input as Record<string, unknown>);
        if (mcp?.responseKind === "self_session") {
          return okSelfSession(result as Record<string, unknown>);
        }
        return ok(result);
      } catch (error) {
        return err(error instanceof Error ? error.message : String(error));
      }
    },
  );
}

export function registerSdkTools(
  server: McpServer,
  ctx: AppContext,
  options: RegisterToolsOptions = {},
): void {
  const runtime = createMcpRuntime(ctx);
  const definitions = filterToolDefinitions(ALL_TOOL_DEFINITIONS, {
    surface: "mcp",
    serverKeyToolsEnabled: options.serverKeyToolsEnabled,
    selfSessionToolsEnabled: options.selfSessionToolsEnabled,
    estimateToolsEnabled: options.estimateToolsEnabled,
  });

  for (const definition of definitions) {
    registerDefinition(server, runtime, definition);
  }
}

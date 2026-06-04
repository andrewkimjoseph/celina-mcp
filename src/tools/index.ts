/** Central tool registry — SDK tool definitions via registerSdkTools. */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../context/app-context.js";
import { registerSdkTools, type RegisterToolsOptions } from "./sdk-register.js";

export type { RegisterToolsOptions };

/** Register every Celina tool on the MCP server from @andrewkimjoseph/celina-sdk/tools. */
export function registerAllTools(
  server: McpServer,
  ctx: AppContext,
  options: RegisterToolsOptions = {},
): void {
  registerSdkTools(server, ctx, options);
}

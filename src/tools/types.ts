/** Contract for domain tool files — implement register() to attach MCP tools to the server. */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../context/app-context.js";

export interface ToolModule {
  register(server: McpServer, ctx: AppContext): void;
}

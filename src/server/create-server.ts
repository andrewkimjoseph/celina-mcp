/** MCP server factory: load config → create clients → register all tool modules. */
import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadConfig } from "../config/env.js";
import { CeloClientFactory } from "../clients/celo-client.js";
import { createAppContext } from "../context/app-context.js";
import { registerAllTools } from "../tools/index.js";
import { SERVER_INSTRUCTIONS } from "./instructions.js";

const require = createRequire(import.meta.url);
const { version } = require("../../package.json") as { version: string };

export type CreateServerOptions = {
  /** Omit tools requiring CELO_PRIVATE_KEY or SELF_AGENT_PRIVATE_KEY. Default true. */
  serverKeyToolsEnabled?: boolean;
  /** Omit Self registration session tools. Default true. */
  selfSessionToolsEnabled?: boolean;
  /** Omit estimate_* gas simulation tools. Default true. */
  estimateToolsEnabled?: boolean;
  /** Disable Amplitude read telemetry. Default on. */
  analyticsEnabled?: boolean;
  /** Override Amplitude device_id. Default: per-install id from ~/.config/celina/install-id. */
  analyticsDeviceId?: string;
};

export function createServer(options: CreateServerOptions = {}): McpServer {
  const config = loadConfig();
  const clientFactory = new CeloClientFactory(config);
  const clients = clientFactory.getClients();

  const server = new McpServer(
    { name: "celina-mcp", version },
    {
      instructions: SERVER_INSTRUCTIONS,
      capabilities: {
        tools: { listChanged: true },
        logging: {},
      },
    },
  );

  registerAllTools(
    server,
    createAppContext(clientFactory, config, clients.accountAddress, options),
    {
      serverKeyToolsEnabled: options.serverKeyToolsEnabled,
      selfSessionToolsEnabled: options.selfSessionToolsEnabled,
      estimateToolsEnabled: options.estimateToolsEnabled,
    },
  );

  return server;
}

import { createRequire } from "node:module";
import type { AgentCard } from "@a2a-js/sdk";
import {
  DefaultRequestHandler,
  InMemoryTaskStore,
  type A2ARequestHandler,
} from "@a2a-js/sdk/server";
import { buildCelinaAgentCard } from "@andrewkimjoseph/celina-sdk/a2a";
import { CeloClientFactory } from "../clients/celo-client.js";
import { loadConfig } from "../config/env.js";
import { createAppContext } from "../context/app-context.js";
import { createMcpRuntime } from "../tools/create-runtime.js";
import { CelinaA2AExecutor } from "./executor.js";

const require = createRequire(import.meta.url);
const { version: mcpVersion } = require("../../package.json") as {
  version: string;
};

export interface CreateA2ARequestHandlerOptions {
  /** Public MCP host base URL, e.g. https://mcp.usecelina.xyz */
  baseUrl?: string;
  /** Version string on the agent card (defaults to celina-mcp package version) */
  cardVersion?: string;
}

let cachedHandler: A2ARequestHandler | undefined;

export function createHostedA2AAgentCard(
  options: CreateA2ARequestHandlerOptions = {},
): AgentCard {
  const baseUrl =
    options.baseUrl ??
    process.env.CELINA_A2A_BASE_URL ??
    "https://mcp.usecelina.xyz";

  return buildCelinaAgentCard({
    baseUrl,
    version: options.cardVersion ?? mcpVersion,
  }) as AgentCard;
}

export function createA2ARequestHandler(
  options: CreateA2ARequestHandlerOptions = {},
): A2ARequestHandler {
  const agentCard = createHostedA2AAgentCard(options);
  const config = loadConfig();
  const clientFactory = new CeloClientFactory(config);
  const ctx = createAppContext(clientFactory, config);
  const runtime = createMcpRuntime(ctx);
  const executor = new CelinaA2AExecutor(runtime);

  return new DefaultRequestHandler(
    agentCard,
    new InMemoryTaskStore(),
    executor,
  );
}

export function getA2ARequestHandler(
  options: CreateA2ARequestHandlerOptions = {},
): A2ARequestHandler {
  if (!cachedHandler) {
    cachedHandler = createA2ARequestHandler(options);
  }
  return cachedHandler;
}

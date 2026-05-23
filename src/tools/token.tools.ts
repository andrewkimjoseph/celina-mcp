import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context/app-context.js";
import type { ToolModule } from "./types.js";
import {
  addressSchema,
  networkSchema,
  resolveNetwork,
  tokenSymbolSchema,
} from "../schemas/common.js";
import { err, ok } from "./helpers.js";

export const tokenTools: ToolModule = {
  register(server: McpServer, ctx: AppContext) {
    server.registerTool(
      "get_celo_balances",
      {
        title: "Get Celo Balances",
        description:
          "Returns native CELO and ERC-20 balances for an address. Defaults to CELO + cUSD.",
        inputSchema: z.object({
          address: addressSchema,
          tokens: z.array(tokenSymbolSchema).optional(),
          network: networkSchema.optional(),
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ address, tokens, network }) => {
        try {
          const resolved = resolveNetwork(network, ctx.config.defaultNetwork);
          return ok(
            await ctx.token.getBalances(
              resolved,
              address as `0x${string}`,
              tokens,
            ),
          );
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );

    server.registerTool(
      "get_token_info",
      {
        title: "Get Token Info",
        description: "Returns metadata for a known or custom ERC-20 token.",
        inputSchema: z.object({
          token: tokenSymbolSchema,
          network: networkSchema.optional(),
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ token, network }) => {
        try {
          const resolved = resolveNetwork(network, ctx.config.defaultNetwork);
          return ok(await ctx.token.getTokenInfo(resolved, token));
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );
  },
};

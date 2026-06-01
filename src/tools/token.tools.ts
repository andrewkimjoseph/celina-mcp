import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context/app-context.js";
import type { ToolModule } from "./types.js";
import { addressSchema, tokenSymbolSchema } from "../schemas/common.js";
import { err, ok } from "./helpers.js";

export const tokenTools: ToolModule = {
  register(server: McpServer, ctx: AppContext) {
    server.registerTool(
      "get_celo_balances",
      {
        title: "Get Celo Balances",
        description:
          "Balances for named registry tokens on Celo mainnet. Default tokens: CELO + USDm. Pass tokens for specific symbols (USDC, WETH, EURm, …).",
        inputSchema: z.object({
          address: addressSchema,
          tokens: z
            .array(tokenSymbolSchema)
            .optional()
            .describe("Registry token symbols to check (default: CELO, USDm)."),
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ address, tokens }) => {
        try {
          return ok(
            await ctx.token.getBalances(
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
      "get_stablecoin_balances",
      {
        title: "Get Stablecoin Balances",
        description:
          "Scan all registry stablecoins for an address in one call (Mento stables, USDC, USDT, GoodDollar, etc.). Omits zero balances by default.",
        inputSchema: z.object({
          address: addressSchema,
          stablecoins: z
            .array(z.string())
            .optional()
            .describe(
              "Stablecoin symbols to check (e.g. USDm, USDC). Defaults to all mainnet stablecoins.",
            ),
          includeZero: z
            .boolean()
            .optional()
            .describe("Include stablecoins with zero balance"),
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ address, stablecoins, includeZero }) => {
        try {
          return ok(
            await ctx.token.getStablecoinBalances(
              address as `0x${string}`,
              { stablecoins, includeZero },
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
        description:
          "Registry token metadata (symbol, address, decimals). Does not read balances.",
        inputSchema: z.object({
          token: tokenSymbolSchema,
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ token }) => {
        try {
          return ok(await ctx.token.getTokenInfo(token));
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );

    server.registerTool(
      "get_token_balance",
      {
        title: "Get Token Balance",
        description:
          "Balance for one registry token. Pass a symbol (USDC, USDm, CELO, …) or a known registry contract address.",
        inputSchema: z.object({
          token: tokenSymbolSchema,
          address: addressSchema,
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ token, address }) => {
        try {
          return ok(
            await ctx.token.getTokenBalance(
              token,
              address as `0x${string}`,
            ),
          );
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );
  },
};

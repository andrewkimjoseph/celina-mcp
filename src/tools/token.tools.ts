import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context/app-context.js";
import type { ToolModule } from "./types.js";
import {
  optionalWalletAddressSchema,
  tokenSymbolSchema,
} from "../schemas/common.js";
import { err, ok } from "./helpers.js";
import { resolveWalletAddress } from "./resolve-wallet.js";

export const tokenTools: ToolModule = {
  register(server: McpServer, ctx: AppContext) {
    server.registerTool(
      "get_celo_balances",
      {
        title: "Get Celo Balances",
        description:
          "Balances for named registry tokens on Celo mainnet. Default tokens: CELO + USDm. Pass tokens for specific symbols (USDC, WETH, EURm, …). Omit address to use the configured signer when CELO_PRIVATE_KEY is set.",
        inputSchema: z.object({
          address: optionalWalletAddressSchema,
          tokens: z
            .array(tokenSymbolSchema)
            .optional()
            .describe("Registry token symbols to check (default: CELO, USDm)."),
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ address, tokens }) => {
        try {
          const target = resolveWalletAddress(ctx, address);
          return ok(await ctx.token.getBalances(target, tokens));
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
          "Scan all registry stablecoins for an address in one call (Mento stables, USDC, USDT, GoodDollar, etc.). Omits zero balances by default. Omit address to use the configured signer when CELO_PRIVATE_KEY is set.",
        inputSchema: z.object({
          address: optionalWalletAddressSchema,
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
          const target = resolveWalletAddress(ctx, address);
          return ok(
            await ctx.token.getStablecoinBalances(target, {
              stablecoins,
              includeZero,
            }),
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
          "Balance for one registry token. Pass a symbol (USDC, USDm, CELO, …) or a known registry contract address. Omit address to use the configured signer when CELO_PRIVATE_KEY is set.",
        inputSchema: z.object({
          token: tokenSymbolSchema,
          address: optionalWalletAddressSchema,
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ token, address }) => {
        try {
          const target = resolveWalletAddress(ctx, address);
          return ok(await ctx.token.getTokenBalance(token, target));
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );
  },
};

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context/app-context.js";
import type { ToolModule } from "./types.js";
import {
  blockIdSchema,
  optionalWalletAddressSchema,
} from "../schemas/common.js";
import { err, ok } from "./helpers.js";
import { resolveWalletAddress } from "./resolve-wallet.js";

export const blockchainTools: ToolModule = {
  register(server: McpServer, ctx: AppContext) {
    server.registerTool(
      "get_network_status",
      {
        title: "Get Network Status",
        description: "Returns Celo mainnet chain ID, latest block, and gas price.",
        inputSchema: z.object({}),
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
        },
      },
      async () => {
        try {
          return ok(await ctx.blockchain.getNetworkStatus());
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );

    server.registerTool(
      "get_block",
      {
        title: "Get Block",
        description: "Fetch a Celo mainnet block by number, hash, or latest.",
        inputSchema: z.object({
          blockId: blockIdSchema,
          includeTransactions: z.boolean().optional(),
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ blockId, includeTransactions }) => {
        try {
          return ok(
            await ctx.blockchain.getBlock(blockId, { includeTransactions }),
          );
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );

    server.registerTool(
      "get_latest_blocks",
      {
        title: "Get Latest Blocks",
        description: "Fetch the most recent blocks on Celo mainnet.",
        inputSchema: z.object({
          count: z.number().int().min(1).max(100).default(5),
          offset: z.number().int().min(0).default(0).optional(),
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ count, offset }) => {
        try {
          return ok(await ctx.blockchain.getLatestBlocks(count, offset ?? 0));
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );

    server.registerTool(
      "get_transaction",
      {
        title: "Get Transaction",
        description: "Fetch a transaction and receipt by hash on Celo mainnet.",
        inputSchema: z.object({
          hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ hash }) => {
        try {
          return ok(
            await ctx.blockchain.getTransaction(hash as `0x${string}`),
          );
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );
  },
};

export const accountTools: ToolModule = {
  register(server: McpServer, ctx: AppContext) {
    server.registerTool(
      "get_wallet_address",
      {
        title: "Get Wallet Address",
        description:
          "Returns the wallet address derived from CELO_PRIVATE_KEY in the server env. Use when you need the signer address explicitly; omit address on other tools to default to this wallet.",
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async () => {
        try {
          const wallet_address = resolveWalletAddress(ctx);
          return ok({
            wallet_address,
            has_wallet: true,
            source: "CELO_PRIVATE_KEY",
          });
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );

    server.registerTool(
      "get_account",
      {
        title: "Get Account",
        description:
          "Returns native CELO balance, nonce, and contract flag on mainnet. Omit address to use the configured signer when CELO_PRIVATE_KEY is set.",
        inputSchema: z.object({
          address: optionalWalletAddressSchema,
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ address }) => {
        try {
          const target = resolveWalletAddress(ctx, address);
          return ok(await ctx.account.getAccount(target));
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );
  },
};

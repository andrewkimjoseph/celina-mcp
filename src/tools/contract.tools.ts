import type { Abi } from "viem";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context/app-context.js";
import {
  abiSchema,
  addressSchema,
  optionalWalletAddressSchema,
} from "../schemas/common.js";
import type { ToolModule } from "./types.js";
import { err, ok } from "./helpers.js";
import { resolveWalletAddress } from "./resolve-wallet.js";

export const contractTools: ToolModule = {
  register(server: McpServer, ctx: AppContext) {
    server.registerTool(
      "call_contract_function",
      {
        title: "Call Contract Function",
        description:
          "Calls a read-only contract function. Requires caller-supplied ABI JSON. Omit fromAddress to use the configured signer when CELO_PRIVATE_KEY is set.",
        inputSchema: z.object({
          contractAddress: addressSchema,
          functionName: z.string().min(1),
          abi: abiSchema,
          functionArgs: z.array(z.unknown()).optional(),
          fromAddress: optionalWalletAddressSchema,
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({
        contractAddress,
        functionName,
        abi,
        functionArgs,
        fromAddress,
      }) => {
        try {
          const from = resolveWalletAddress(ctx, fromAddress);
          return ok(
            await ctx.contract.callFunction({
              contractAddress: contractAddress as `0x${string}`,
              functionName,
              abi: abi as unknown as Abi,
              functionArgs,
              fromAddress: from,
            }),
          );
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );

    server.registerTool(
      "estimate_contract_gas",
      {
        title: "Estimate Contract Gas",
        description:
          "Estimates gas for a contract function call. Requires caller-supplied ABI JSON. Omit fromAddress to use the configured signer when CELO_PRIVATE_KEY is set.",
        inputSchema: z.object({
          contractAddress: addressSchema,
          functionName: z.string().min(1),
          abi: abiSchema,
          fromAddress: optionalWalletAddressSchema,
          functionArgs: z.array(z.unknown()).optional(),
          value: z.string().optional().describe("Value in wei (decimal string)"),
        }),
        annotations: { readOnlyHint: true },
      },
      async ({
        contractAddress,
        functionName,
        abi,
        fromAddress,
        functionArgs,
        value,
      }) => {
        try {
          const from = resolveWalletAddress(ctx, fromAddress);
          return ok(
            await ctx.contract.estimateGas({
              contractAddress: contractAddress as `0x${string}`,
              functionName,
              abi: abi as unknown as Abi,
              fromAddress: from,
              functionArgs,
              value,
            }),
          );
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );
  },
};

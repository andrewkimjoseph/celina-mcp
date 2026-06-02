import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context/app-context.js";
import type { ToolModule } from "./types.js";
import { optionalWalletAddressSchema } from "../schemas/common.js";
import { err, ok } from "./helpers.js";
import { resolveWalletAddress } from "./resolve-wallet.js";

export const gooddollarTools: ToolModule = {
  register(server: McpServer, ctx: AppContext) {
    server.registerTool(
      "get_gooddollar_whitelisting_info",
      {
        title: "Get GoodDollar Whitelisting Info",
        description:
          "Returns GoodDollar IdentityV4 whitelisting status for a wallet, including when it was whitelisted, last authentication date, and reverification progress. Omit address to use the configured signer when CELO_PRIVATE_KEY is set.",
        inputSchema: z.object({
          address: optionalWalletAddressSchema,
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ address }) => {
        try {
          const target = resolveWalletAddress(ctx, address);
          return ok(await ctx.gooddollar.getWhitelistingInfo(target));
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );

    server.registerTool(
      "get_gooddollar_ubi_entitlement",
      {
        title: "Get GoodDollar UBI Entitlement",
        description:
          "Returns daily GoodDollar UBI claim eligibility for a wallet: whitelist root, claimable G$ amount, already-claimed status, scheme state, and reasons when not eligible. Call before claim_daily_gooddollar_ubi. Omit address to use the configured signer when CELO_PRIVATE_KEY is set.",
        inputSchema: z.object({
          address: optionalWalletAddressSchema,
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ address }) => {
        try {
          const target = resolveWalletAddress(ctx, address);
          return ok(await ctx.gooddollar.getUbiClaimEligibility(target));
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );

    server.registerTool(
      "claim_daily_gooddollar_ubi",
      {
        title: "Claim Daily GoodDollar UBI",
        description:
          "Claim today's GoodDollar UBI (G$) from UBISchemeV2 on Celo mainnet for the MCP server wallet. One claim per identity per day. Validates whitelist and entitlement before submitting. Requires CELO_PRIVATE_KEY in MCP server env (signer receives G$ and pays gas in CELO). Use get_gooddollar_ubi_entitlement first when checking eligibility.",
        inputSchema: z.object({}),
        annotations: {
          destructiveHint: true,
          openWorldHint: true,
        },
      },
      async () => {
        try {
          return ok(await ctx.gooddollarWrite.claimDailyUbi());
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );
  },
};

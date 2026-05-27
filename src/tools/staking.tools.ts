import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context/app-context.js";
import { addressSchema, paginationSchema } from "../schemas/common.js";
import type { ToolModule } from "./types.js";
import { err, ok } from "./helpers.js";

export const stakingTools: ToolModule = {
  register(server: McpServer, ctx: AppContext) {
    server.registerTool(
      "get_staking_balances",
      {
        title: "Get Staking Balances",
        description:
          "Returns active and pending staking votes for an address, broken down by validator group.",
        inputSchema: z.object({
          address: addressSchema,
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ address }) => {
        try {
          return ok(
            await ctx.staking.getStakingBalances(address as `0x${string}`),
          );
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );

    server.registerTool(
      "get_activatable_stakes",
      {
        title: "Get Activatable Stakes",
        description:
          "Returns validator groups where pending stakes can be activated for an address.",
        inputSchema: z.object({
          address: addressSchema,
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ address }) => {
        try {
          return ok(
            await ctx.staking.getActivatableStakes(address as `0x${string}`),
          );
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );

    server.registerTool(
      "get_validator_groups",
      {
        title: "Get Validator Groups",
        description:
          "Returns paginated validator groups with votes, capacity, and member counts.",
        inputSchema: z.object({
          page: paginationSchema.page,
          pageSize: z.number().int().min(1).max(50).optional().default(10),
          offset: paginationSchema.offset,
          limit: paginationSchema.limit,
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ page, pageSize, offset, limit }) => {
        try {
          return ok(
            await ctx.staking.getValidatorGroups({
              page,
              pageSize,
              offset,
              limit,
            }),
          );
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );

    server.registerTool(
      "get_validator_group_details",
      {
        title: "Get Validator Group Details",
        description:
          "Returns detailed information about a specific validator group including members.",
        inputSchema: z.object({
          groupAddress: addressSchema,
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ groupAddress }) => {
        try {
          return ok(
            await ctx.staking.getValidatorGroupDetails(
              groupAddress as `0x${string}`,
            ),
          );
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );

    server.registerTool(
      "get_total_staking_info",
      {
        title: "Get Total Staking Info",
        description: "Returns network-wide staking participation metrics.",
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async () => {
        try {
          return ok(await ctx.staking.getTotalStakingInfo());
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );
  },
};

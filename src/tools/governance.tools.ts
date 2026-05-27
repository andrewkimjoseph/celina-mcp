import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context/app-context.js";
import { paginationSchema } from "../schemas/common.js";
import type { ToolModule } from "./types.js";
import { err, ok } from "./helpers.js";

export const governanceTools: ToolModule = {
  register(server: McpServer, ctx: AppContext) {
    server.registerTool(
      "get_governance_proposals",
      {
        title: "Get Governance Proposals",
        description:
          "Returns Celo governance proposals with pagination. Set include_metadata=false for faster responses.",
        inputSchema: z.object({
          includeInactive: z.boolean().optional().default(true),
          includeMetadata: z.boolean().optional().default(true),
          page: paginationSchema.page,
          pageSize: z.number().int().min(1).max(20).optional().default(10),
          offset: paginationSchema.offset,
          limit: paginationSchema.limit,
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({
        includeInactive,
        includeMetadata,
        page,
        pageSize,
        offset,
        limit,
      }) => {
        try {
          return ok(
            await ctx.governance.getGovernanceProposals({
              includeInactive,
              includeMetadata,
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
      "get_proposal_details",
      {
        title: "Get Proposal Details",
        description:
          "Returns detailed information about a Celo governance proposal including CGP content when available.",
        inputSchema: z.object({
          proposalId: z.number().int().min(0),
        }),
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ proposalId }) => {
        try {
          return ok(await ctx.governance.getProposalDetails(proposalId));
        } catch (error) {
          return err(error instanceof Error ? error.message : String(error));
        }
      },
    );
  },
};

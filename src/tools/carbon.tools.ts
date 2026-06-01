import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context/app-context.js";
import { addressSchema } from "../schemas/common.js";
import type { ToolModule } from "./types.js";
import { err, ok } from "./helpers.js";

const walletField = {
  wallet_address: addressSchema.describe(
    "Wallet that owns or signs Carbon strategies on Celo",
  ),
};

const tokenPairSchema = z.object({
  base_token: z.string().describe("Base token symbol or 0x address"),
  quote_token: z.string().describe("Quote token symbol or 0x address"),
});

function wrap(handler: () => Promise<unknown>) {
  return async () => {
    try {
      return ok(await handler());
    } catch (error) {
      return err(error instanceof Error ? error.message : String(error));
    }
  };
}

export type CarbonToolsOptions = {
  /** When false (hosted MCP), write/prepare tools are omitted. */
  writesEnabled?: boolean;
};

export function createCarbonToolsModule(
  options: CarbonToolsOptions = {},
): ToolModule {
  const writesEnabled = options.writesEnabled !== false;

  return {
    register(server: McpServer, ctx: AppContext) {
      server.registerTool(
        "get_carbon_strategies",
        {
          title: "Get Carbon Strategies",
          description:
            "Fetch active Carbon DeFi maker strategies for a wallet on Celo. Call before create or manage operations.",
          inputSchema: z.object(walletField),
          annotations: { readOnlyHint: true },
        },
        async ({ wallet_address }) =>
          wrap(() =>
            ctx.carbon.getStrategies(wallet_address as `0x${string}`),
          )(),
      );

      server.registerTool(
        "get_carbon_strategy",
        {
          title: "Get Carbon Strategy",
          description: "Look up a Carbon strategy by ID on Celo (status, prices, budgets, fills).",
          inputSchema: z.object({
            strategy_id: z.string().describe("Carbon strategy NFT id"),
          }),
          annotations: { readOnlyHint: true },
        },
        async ({ strategy_id }) =>
          wrap(() => ctx.carbon.getStrategy(strategy_id))(),
      );

      server.registerTool(
        "get_carbon_trade_quote",
        {
          title: "Get Carbon Trade Quote",
          description:
            "Quote a taker swap against Carbon DeFi maker liquidity on Celo.",
          inputSchema: z
            .object({
              source_token: z.string(),
              target_token: z.string(),
              amount: z.string(),
              is_trade_by_target: z.boolean().optional(),
            })
            .passthrough(),
          annotations: { readOnlyHint: true },
        },
        async (args) => wrap(() => ctx.carbon.getTradeQuote(args))(),
      );

      server.registerTool(
        "explore_carbon_pair",
        {
          title: "Explore Carbon Pair",
          description:
            "Market liquidity and top strategies for a token pair on Carbon DeFi (Celo).",
          inputSchema: tokenPairSchema,
          annotations: { readOnlyHint: true },
        },
        async (args) => wrap(() => ctx.carbon.explorePair(args))(),
      );

      server.registerTool(
        "resolve_carbon_token",
        {
          title: "Resolve Carbon Token",
          description:
            "Resolve a token symbol or name to its Celo contract address (Carbon API, with Celina registry fallback).",
          inputSchema: z.object({
            token: z.string().describe("Symbol or name, e.g. USDC"),
          }),
          annotations: { readOnlyHint: true },
        },
        async ({ token }) => wrap(() => ctx.carbon.resolveToken(token))(),
      );

      server.registerTool(
        "get_carbon_activity",
        {
          title: "Get Carbon Activity",
          description: "Trade and event history for a wallet or strategy on Celo.",
          inputSchema: z.object(walletField).passthrough(),
          annotations: { readOnlyHint: true },
        },
        async (args) => wrap(() => ctx.carbon.getActivity(args))(),
      );

      server.registerTool(
        "find_carbon_opportunities",
        {
          title: "Find Carbon Opportunities",
          description:
            "Find discount buys and premium sells vs market on a Carbon pair (Celo).",
          inputSchema: tokenPairSchema.passthrough(),
          annotations: { readOnlyHint: true },
        },
        async (args) => wrap(() => ctx.carbon.findOpportunities(args))(),
      );

      server.registerTool(
        "get_carbon_protocol_stats",
        {
          title: "Get Carbon Protocol Stats",
          description: "Carbon DeFi TVL, volume, and fees on Celo (up to 30 days).",
          inputSchema: z
            .object({
              period_days: z.number().int().positive().max(30).optional(),
            })
            .passthrough(),
          annotations: { readOnlyHint: true },
        },
        async (args) => wrap(() => ctx.carbon.getProtocolStats(args))(),
      );

      server.registerTool(
        "get_carbon_price_history",
        {
          title: "Get Carbon Price History",
          description: "Historical OHLC for a Carbon token pair on Celo.",
          inputSchema: tokenPairSchema.passthrough(),
          annotations: { readOnlyHint: true },
        },
        async (args) => wrap(() => ctx.carbon.getPriceHistory(args))(),
      );

      server.registerTool(
        "simulate_carbon_strategy",
        {
          title: "Simulate Carbon Strategy",
          description:
            "Backtest a strategy configuration against historical prices (up to 365 days) before committing capital.",
          inputSchema: z.object({}).passthrough(),
          annotations: { readOnlyHint: true },
        },
        async (args) => wrap(() => ctx.carbon.simulateStrategy(args))(),
      );

      server.registerTool(
        "carbon_help",
        {
          title: "Carbon Help",
          description: "Per-tool guidance for Carbon DeFi MCP operations on Celo.",
          inputSchema: z.object({
            topic: z.string().optional().describe("Tool name or topic"),
          }),
          annotations: { readOnlyHint: true },
        },
        async ({ topic }) => wrap(() => ctx.carbon.help(topic))(),
      );

      server.registerTool(
        "carbon_learn",
        {
          title: "Carbon Learn",
          description: "Protocol education topics for Carbon DeFi on Celo.",
          inputSchema: z.object({
            topic: z.string().optional().describe("e.g. recurring_strategy"),
          }),
          annotations: { readOnlyHint: true },
        },
        async ({ topic }) => wrap(() => ctx.carbon.learn(topic))(),
      );

      if (!writesEnabled) return;

      const writeSchema = z.object({}).passthrough();

      const registerPrepare = (
        name: string,
        title: string,
        description: string,
        invoke: (body: Record<string, unknown> & { wallet_address: `0x${string}` }) => Promise<unknown>,
      ) => {
        server.registerTool(
          name,
          {
            title,
            description:
              description +
              " Returns unsigned transaction data and warnings — user must sign. Prices are quote per base; buy budget in quote, sell budget in base.",
            inputSchema: writeSchema,
            annotations: { destructiveHint: true, openWorldHint: true },
          },
          async (args) => {
            const wallet = args.wallet_address as `0x${string}` | undefined;
            if (!wallet) {
              return err("wallet_address is required");
            }
            return wrap(() =>
              invoke({ ...args, wallet_address: wallet }),
            )();
          },
        );
      };

      registerPrepare(
        "prepare_carbon_limit_order",
        "Prepare Carbon Limit Order",
        "Create a one-time Carbon limit order on Celo.",
        (body) => ctx.carbon.prepareLimitOrder(body),
      );
      registerPrepare(
        "prepare_carbon_range_order",
        "Prepare Carbon Range Order",
        "Create a Carbon range order (gradual execution) on Celo.",
        (body) => ctx.carbon.prepareRangeOrder(body),
      );
      registerPrepare(
        "prepare_carbon_recurring_strategy",
        "Prepare Carbon Recurring Strategy",
        "Create a recurring buy/sell Carbon strategy on Celo (zero maker gas on fills).",
        (body) => ctx.carbon.prepareRecurringStrategy(body),
      );
      registerPrepare(
        "prepare_carbon_concentrated_strategy",
        "Prepare Carbon Concentrated Strategy",
        "Create concentrated two-sided Carbon liquidity on Celo.",
        (body) => ctx.carbon.prepareConcentratedStrategy(body),
      );
      registerPrepare(
        "prepare_carbon_full_range_strategy",
        "Prepare Carbon Full Range Strategy",
        "Create full-range Carbon liquidity on Celo.",
        (body) => ctx.carbon.prepareFullRangeStrategy(body),
      );
      registerPrepare(
        "prepare_carbon_reprice_strategy",
        "Prepare Carbon Reprice",
        "Update price ranges of an existing Carbon strategy on Celo.",
        (body) => ctx.carbon.prepareRepriceStrategy(body),
      );
      registerPrepare(
        "prepare_carbon_edit_strategy",
        "Prepare Carbon Edit Strategy",
        "Edit prices and budgets (and optionally type) of a Carbon strategy on Celo.",
        (body) => ctx.carbon.prepareEditStrategy(body),
      );
      registerPrepare(
        "prepare_carbon_deposit_budget",
        "Prepare Carbon Deposit",
        "Add funds to a Carbon strategy on Celo.",
        (body) => ctx.carbon.prepareDepositBudget(body),
      );
      registerPrepare(
        "prepare_carbon_withdraw_budget",
        "Prepare Carbon Withdraw",
        "Withdraw funds from a Carbon strategy on Celo.",
        (body) => ctx.carbon.prepareWithdrawBudget(body),
      );
      registerPrepare(
        "prepare_carbon_pause_strategy",
        "Prepare Carbon Pause",
        "Pause a Carbon strategy (funds remain) on Celo.",
        (body) => ctx.carbon.preparePauseStrategy(body),
      );
      registerPrepare(
        "prepare_carbon_resume_strategy",
        "Prepare Carbon Resume",
        "Resume a paused Carbon strategy on Celo.",
        (body) => ctx.carbon.prepareResumeStrategy(body),
      );
      registerPrepare(
        "prepare_carbon_delete_strategy",
        "Prepare Carbon Delete",
        "Permanently close a Carbon strategy on Celo.",
        (body) => ctx.carbon.prepareDeleteStrategy(body),
      );
      registerPrepare(
        "prepare_carbon_trade",
        "Prepare Carbon Trade",
        "Build an unsigned taker swap against Carbon liquidity on Celo.",
        (body) => ctx.carbon.prepareTrade(body),
      );
    },
  };
}

/** Default Carbon tools module (stdio MCP — includes prepare/write tools). */
export const carbonTools: ToolModule = createCarbonToolsModule({
  writesEnabled: true,
});

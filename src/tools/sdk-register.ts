import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ALL_TOOL_DEFINITIONS,
  filterToolDefinitions,
  type ToolDefinition,
  type ToolRuntime,
} from "@andrewkimjoseph/celina-sdk/tools";
import type { AppContext } from "../context/app-context.js";
import { err, ok, okSelfSession } from "./helpers.js";
import { resolveWalletAddress } from "./resolve-wallet.js";
import { resolveCarbonToolsOptions } from "./carbon-options.js";

export type RegisterToolsOptions = {
  carbonExecuteEnabled?: boolean;
  carbonPrepareEnabled?: boolean;
  serverKeyToolsEnabled?: boolean;
  selfSessionToolsEnabled?: boolean;
  estimateToolsEnabled?: boolean;
  carbonWritesEnabled?: boolean;
};

function createMcpRuntime(ctx: AppContext): ToolRuntime {
  return {
    celina: ctx.sdk,
    resolveWallet: (input) =>
      resolveWalletAddress(
        ctx,
        input?.address ?? input?.wallet_address ?? input?.from,
      ),
    mcpWallet: ctx.config.walletAddress
      ? {
          address: ctx.config.walletAddress,
          hasWallet: ctx.config.hasWallet,
        }
      : undefined,
    executors: {
      transaction: {
        estimateSend: (to, token, amount) =>
          ctx.transaction.estimateSend(to, token, amount),
        sendToken: (to, token, amount) =>
          ctx.transaction.sendToken(to, token, amount),
      },
      mentoFx: {
        estimate: (tokenIn, tokenOut, amount, options) =>
          ctx.mentoFx.estimateFx(tokenIn, tokenOut, amount, {
            recipient: options?.recipient,
            slippageTolerance: options?.slippageTolerance,
            deadlineMinutes: options?.deadlineMinutes,
          }),
        execute: (tokenIn, tokenOut, amount, options) =>
          ctx.mentoFx.executeFx(tokenIn, tokenOut, amount, {
            recipient: options?.recipient,
            slippageTolerance: options?.slippageTolerance,
            deadlineMinutes: options?.deadlineMinutes,
          }),
      },
      uniswap: {
        estimate: (tokenIn, tokenOut, amount, options) =>
          ctx.uniswap.estimateSwap(tokenIn, tokenOut, amount, {
            recipient: options?.recipient,
            slippageTolerance: options?.slippageTolerance,
            deadlineMinutes: options?.deadlineMinutes,
          }),
        execute: (tokenIn, tokenOut, amount, options) =>
          ctx.uniswap.executeSwap(tokenIn, tokenOut, amount, {
            recipient: options?.recipient,
            slippageTolerance: options?.slippageTolerance,
            deadlineMinutes: options?.deadlineMinutes,
          }),
      },
      aave: {
        supply: (token, amount) => ctx.aave.supply(token, amount),
        withdraw: (token, amount, withdrawMax) =>
          ctx.aave.withdraw(token, amount, withdrawMax),
      },
      carbonWrite: {
        executeLimitOrder: (body) => ctx.carbonWrite.executeLimitOrder(body),
        executeRangeOrder: (body) => ctx.carbonWrite.executeRangeOrder(body),
        executeRecurringStrategy: (body) =>
          ctx.carbonWrite.executeRecurringStrategy(body),
        executeConcentratedStrategy: (body) =>
          ctx.carbonWrite.executeConcentratedStrategy(body),
        executeFullRangeStrategy: (body) =>
          ctx.carbonWrite.executeFullRangeStrategy(body),
        executeRepriceStrategy: (body) =>
          ctx.carbonWrite.executeRepriceStrategy(body),
        executeEditStrategy: (body) => ctx.carbonWrite.executeEditStrategy(body),
        executeDepositBudget: (body) => ctx.carbonWrite.executeDepositBudget(body),
        executeWithdrawBudget: (body) =>
          ctx.carbonWrite.executeWithdrawBudget(body),
        executePauseStrategy: (body) => ctx.carbonWrite.executePauseStrategy(body),
        executeResumeStrategy: (body) =>
          ctx.carbonWrite.executeResumeStrategy(body),
        executeDeleteStrategy: (body) => ctx.carbonWrite.executeDeleteStrategy(body),
        executeTrade: (body) => ctx.carbonWrite.executeTrade(body),
      },
      gooddollarWrite: {
        claimDailyUbi: () => ctx.gooddollarWrite.claimDailyUbi(),
        estimateReserveSwap: (tokenIn, tokenOut, amount, options) =>
          ctx.gooddollarWrite.estimateReserveSwap(tokenIn, tokenOut, amount, {
            recipient: options?.recipient,
            slippageTolerance: options?.slippageTolerance,
          }),
        executeReserveSwap: (tokenIn, tokenOut, amount, options) =>
          ctx.gooddollarWrite.executeReserveSwap(tokenIn, tokenOut, amount, {
            recipient: options?.recipient,
            slippageTolerance: options?.slippageTolerance,
          }),
      },
      self: {
        verifyAgent: (args) =>
          ctx.self.verifyAgent({
            agentAddress: args.agent_address as `0x${string}`,
            requireAge: args.require_age as 0 | 18 | 21 | undefined,
            requireOfac: args.require_ofac as boolean | undefined,
            requireSelfProvider: args.require_self_provider as boolean | undefined,
          }),
        lookupAgent: (agentId) => ctx.self.lookupAgent(agentId),
        verifyRequest: (args) =>
          ctx.self.verifyRequest({
            agentSignature: args.agent_signature as `0x${string}`,
            agentTimestamp: args.agent_timestamp as string,
            method: args.method as string,
            path: args.path as string,
            body: args.body as string | undefined,
            keytype: args.keytype as string | undefined,
            agentKey: args.agent_key as `0x${string}` | undefined,
          }),
        registerAgent: (args) =>
          ctx.self.registerAgent({
            mode: args.mode as never,
            minimumAge: args.minimum_age as 0 | 18 | 21 | undefined,
            ofac: args.ofac as boolean | undefined,
            humanAddress: args.human_address as `0x${string}` | undefined,
            agentName: args.agent_name as string | undefined,
            agentDescription: args.agent_description as string | undefined,
          }),
        checkRegistration: (sessionId) => ctx.self.checkRegistration(sessionId),
        getIdentity: () => ctx.self.getIdentity(),
        refreshProof: (args) =>
          ctx.self.refreshProof({
            agentId: args.agent_id as number | undefined,
          }),
        deregisterAgent: () => ctx.self.deregisterAgent(),
        signRequest: (args) =>
          ctx.self.signRequest({
            method: args.method as "GET" | "POST" | "PUT" | "DELETE",
            url: args.url as string,
            body: args.body as string | undefined,
          }),
        authenticatedFetch: (args) =>
          ctx.self.authenticatedFetch({
            method: args.method as "GET" | "POST" | "PUT" | "DELETE",
            url: args.url as string,
            body: args.body as string | undefined,
            contentType: args.content_type as string | undefined,
          }),
      },
    },
  };
}

function registerDefinition(
  server: McpServer,
  runtime: ToolRuntime,
  definition: ToolDefinition,
): void {
  const { name, description, inputSchema, mcp } = definition;
  server.registerTool(
    name,
    {
      title: mcp?.title ?? name,
      description,
      inputSchema,
      annotations: mcp?.annotations,
    },
    async (input) => {
      try {
        const result = await definition.handler(runtime, input as Record<string, unknown>);
        if (mcp?.responseKind === "self_session") {
          return okSelfSession(result as Record<string, unknown>);
        }
        return ok(result);
      } catch (error) {
        return err(error instanceof Error ? error.message : String(error));
      }
    },
  );
}

export function registerSdkTools(
  server: McpServer,
  ctx: AppContext,
  options: RegisterToolsOptions = {},
): void {
  const carbonOpts = resolveCarbonToolsOptions({
    prepareEnabled: options.carbonPrepareEnabled,
    executeEnabled: options.carbonExecuteEnabled,
    ...(options.carbonWritesEnabled === false ? { writesEnabled: false } : {}),
  });

  const runtime = createMcpRuntime(ctx);
  const definitions = filterToolDefinitions(ALL_TOOL_DEFINITIONS, {
    surface: "mcp",
    carbonPrepareEnabled: carbonOpts.prepareEnabled,
    carbonExecuteEnabled: carbonOpts.executeEnabled,
    serverKeyToolsEnabled: options.serverKeyToolsEnabled,
    selfSessionToolsEnabled: options.selfSessionToolsEnabled,
    estimateToolsEnabled: options.estimateToolsEnabled,
  });

  for (const definition of definitions) {
    registerDefinition(server, runtime, definition);
  }
}

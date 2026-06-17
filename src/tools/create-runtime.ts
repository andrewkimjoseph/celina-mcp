import type { ToolRuntime, ToolRuntimeExecutors } from "@andrewkimjoseph/celina-sdk/tools";
import type { AppContext } from "../context/app-context.js";
import { resolveWalletAddress } from "./resolve-wallet.js";

export function createMcpRuntime(ctx: AppContext): ToolRuntime {
  const executors: ToolRuntimeExecutors = {
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
          path: (args.request_path ?? args.path) as string,
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
  };

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
    executors,
  };
}

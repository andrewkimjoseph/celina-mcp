import type { AppContext } from "../context/app-context.js";

function formatKeyErrors(ctx: AppContext): string | undefined {
  const parts = [
    ctx.config.keyErrors?.celo,
    ctx.config.keyErrors?.selfAgent,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

export function resolveWalletAddress(
  ctx: AppContext,
  explicit?: string,
): `0x${string}` {
  if (explicit) {
    return explicit as `0x${string}`;
  }
  if (ctx.config.walletAddress) {
    return ctx.config.walletAddress;
  }
  const keyError = formatKeyErrors(ctx);
  if (keyError) {
    throw new Error(keyError);
  }
  throw new Error(
    "No wallet configured. Set CELO_PRIVATE_KEY or SELF_AGENT_PRIVATE_KEY in the server env, or pass an explicit address.",
  );
}

export function assertSelfAgentKey(ctx: AppContext): void {
  if (ctx.config.keyErrors?.selfAgent) {
    throw new Error(ctx.config.keyErrors.selfAgent);
  }
}

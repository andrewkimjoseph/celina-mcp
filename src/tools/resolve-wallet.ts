import type { AppContext } from "../context/app-context.js";

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
  throw new Error(
    "No wallet configured. Set CELO_PRIVATE_KEY in the server env, or pass an explicit address.",
  );
}

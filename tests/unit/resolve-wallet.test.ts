import { describe, expect, it } from "vitest";
import type { AppContext } from "../../src/context/app-context.js";
import { resolveWalletAddress } from "../../src/tools/resolve-wallet.js";

const CONFIGURED_WALLET =
  "0xC1aC9666aa6704758644ee42c9354ce28a43f878" as const;
const OTHER_WALLET = "0x0000000000000000000000000000000000000001" as const;

function ctxWithWallet(wallet?: `0x${string}`): AppContext {
  return {
    config: {
      hasWallet: Boolean(wallet),
      walletAddress: wallet,
      hasSelfAgentKey: false,
    },
  } as AppContext;
}

describe("resolveWalletAddress", () => {
  it("returns explicit address when provided", () => {
    expect(
      resolveWalletAddress(ctxWithWallet(CONFIGURED_WALLET), OTHER_WALLET),
    ).toBe(OTHER_WALLET);
  });

  it("returns ctx.config.walletAddress when explicit is omitted", () => {
    expect(resolveWalletAddress(ctxWithWallet(CONFIGURED_WALLET))).toBe(
      CONFIGURED_WALLET,
    );
  });

  it("throws when no explicit address and no configured wallet", () => {
    expect(() => resolveWalletAddress(ctxWithWallet())).toThrow(
      /Set CELO_PRIVATE_KEY or SELF_AGENT_PRIVATE_KEY/,
    );
  });

  it("throws keyErrors message when no wallet and invalid key configured", () => {
    expect(() =>
      resolveWalletAddress({
        config: {
          hasWallet: false,
          hasSelfAgentKey: false,
          hasCeloKey: false,
          keyErrors: {
            celo: "CELO_PRIVATE_KEY is set but invalid (expected 64 hex characters, with or without 0x prefix). Remove it or fix it.",
          },
        },
      } as AppContext),
    ).toThrow(/CELO_PRIVATE_KEY is set but invalid/);
  });
});

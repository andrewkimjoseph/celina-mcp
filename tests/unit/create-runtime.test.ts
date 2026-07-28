import { getToolDefinition } from "@andrewkimjoseph/celina-sdk/tools";
import { describe, expect, it, vi } from "vitest";
import type { AppContext } from "../../src/context/app-context.js";
import { createMcpRuntime } from "../../src/tools/create-runtime.js";

const CELO_ADDRESS = "0xC1aC9666aa6704758644ee42c9354ce28a43f878" as const;
const SELF_AGENT_ADDRESS = "0x7C6c7C0DE51f5F2ed56936b568A44c266A255f81" as const;

function buildContext(config: Partial<AppContext["config"]>): AppContext {
  return {
    config: {
      hasWallet: true,
      hasSelfAgentKey: false,
      hasCeloKey: false,
      ...config,
    },
    transaction: {
      estimateSend: vi.fn(),
      sendToken: vi.fn(),
    },
  } as unknown as AppContext;
}

describe("createMcpRuntime mcpWallet", () => {
  it("exposes both wallets and the default signer when both keys are configured", () => {
    const ctx = buildContext({
      walletAddress: CELO_ADDRESS,
      signer: "celo",
      hasSelfAgentKey: true,
      hasCeloKey: true,
      celoAddress: CELO_ADDRESS,
      selfAgentAddress: SELF_AGENT_ADDRESS,
    });

    const runtime = createMcpRuntime(ctx);

    expect(runtime.mcpWallet).toMatchObject({
      address: CELO_ADDRESS,
      hasWallet: true,
      signer: "celo",
      wallets: {
        celo: { address: CELO_ADDRESS },
        self_agent: { address: SELF_AGENT_ADDRESS },
      },
    });
  });

  it("omits the self_agent wallet entry when only CELO_PRIVATE_KEY is configured", () => {
    const ctx = buildContext({
      walletAddress: CELO_ADDRESS,
      signer: "celo",
      hasCeloKey: true,
      celoAddress: CELO_ADDRESS,
    });

    const runtime = createMcpRuntime(ctx);

    expect(runtime.mcpWallet?.wallets?.celo).toEqual({ address: CELO_ADDRESS });
    expect(runtime.mcpWallet?.wallets?.self_agent).toBeUndefined();
  });

  it("get_wallet_address tool returns both wallets and resolves an explicit signer", async () => {
    const ctx = buildContext({
      walletAddress: CELO_ADDRESS,
      signer: "celo",
      hasSelfAgentKey: true,
      hasCeloKey: true,
      celoAddress: CELO_ADDRESS,
      selfAgentAddress: SELF_AGENT_ADDRESS,
    });
    const runtime = createMcpRuntime(ctx);
    const definition = getToolDefinition("get_wallet_address")!;

    const defaultResult = (await definition.handler(runtime, {})) as Record<
      string,
      unknown
    >;
    expect(defaultResult.wallet_address).toBe(CELO_ADDRESS);
    expect(defaultResult.source).toBe("CELO_PRIVATE_KEY");
    expect(defaultResult.wallets).toEqual({
      celo: { address: CELO_ADDRESS },
      self_agent: { address: SELF_AGENT_ADDRESS },
    });

    const selfResult = (await definition.handler(runtime, {
      signer: "self_agent",
    })) as Record<string, unknown>;
    expect(selfResult.wallet_address).toBe(SELF_AGENT_ADDRESS);
    expect(selfResult.source).toBe("SELF_AGENT_PRIVATE_KEY");
  });

  it("send_token executor threads the signer through to ctx.transaction.sendToken", async () => {
    const ctx = buildContext({
      walletAddress: CELO_ADDRESS,
      signer: "celo",
      hasSelfAgentKey: true,
      hasCeloKey: true,
      celoAddress: CELO_ADDRESS,
      selfAgentAddress: SELF_AGENT_ADDRESS,
    });
    const runtime = createMcpRuntime(ctx);

    await runtime.executors?.transaction?.sendToken(
      SELF_AGENT_ADDRESS,
      "CELO",
      "5.2",
      "celo",
    );

    expect(ctx.transaction.sendToken).toHaveBeenCalledWith(
      SELF_AGENT_ADDRESS,
      "CELO",
      "5.2",
      "celo",
    );
  });
});

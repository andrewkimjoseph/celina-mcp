import { describe, expect, it, vi, beforeEach } from "vitest";
import { carbonActivityDeepLink } from "@andrewkimjoseph/celina-sdk";

const WALLET = "0xC1aC9666aa6704758644ee42c9354ce28a43f878" as const;

vi.mock("../../src/services/execute-prepared-flow.js", () => ({
  requireWalletClients: (clients: {
    wallet: unknown;
    accountAddress: `0x${string}`;
  }) => clients,
  executePreparedFlow: vi.fn().mockResolvedValue({
    stepHashes: ["0xabc" as const],
    hash: "0xabc" as const,
    status: "success",
  }),
}));

import { CarbonWriteService } from "../../src/services/carbon-write.service.js";

describe("carbon execute deep_link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carbonActivityDeepLink points to activity explorer", () => {
    expect(carbonActivityDeepLink(WALLET)).toBe(
      `https://celo.carbondefi.xyz/explore/activity?search=${WALLET}`,
    );
  });

  it("executeLimitOrder includes activity deep_link for the signer", async () => {
    const mockSdk = {
      carbon: {
        buildExecutionSteps: vi.fn().mockResolvedValue([
          {
            kind: "contract",
            to: "0x6619871118D144c1c28eC3b23036FC1f0829ed3a",
            data: "0xabc",
            description: "Carbon tx",
          },
        ]),
        prepareLimitOrder: vi.fn().mockResolvedValue({
          status: "ok",
          warnings: [],
          preparedFlow: {
            from: WALLET,
            steps: [],
            summary: "Carbon limit order",
            network: "mainnet",
            preparedFlow: true,
          },
        }),
      },
    };

    const mockClientFactory = {
      getClients: () => ({
        accountAddress: WALLET,
        wallet: { account: { address: WALLET } },
        public: {},
      }),
    };

    const service = new CarbonWriteService(
      mockClientFactory as never,
      mockSdk as never,
    );

    const result = await service.executeLimitOrder({
      base_token: "CELO",
      quote_token: "USDT",
      direction: "buy",
      price: 0.5,
      budget: 1,
    });

    expect(result.deep_link).toBe(carbonActivityDeepLink(WALLET));
    expect(result.from).toBe(WALLET);
    expect(result.status).toBe("success");
  });
});

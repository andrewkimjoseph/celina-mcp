import { describe, expect, it, vi } from "vitest";
import type { PublicClient, WalletClient } from "viem";
import { GoodDollarFaceVerificationService } from "../../src/services/gooddollar-face-verification.service.js";
import type { CeloClientFactory } from "../../src/clients/celo-client.js";

const ACCOUNT = "0x5409ED021D9299bf6814279A6A1411A7e866A631" as const;
const CALLBACK = "https://example.com/callback";

describe("GoodDollarFaceVerificationService", () => {
  it("forwards configured viem clients to celina-sdk", async () => {
    const publicClient = {} as PublicClient;
    const walletClient = {} as WalletClient;

    const clientFactory = {
      getClients: vi.fn().mockReturnValue({
        public: publicClient,
        wallet: walletClient,
        accountAddress: ACCOUNT,
      }),
    } as unknown as CeloClientFactory;

    const getFaceVerificationLink = vi.fn().mockResolvedValue({
      from: ACCOUNT,
      callbackUrl: CALLBACK,
      link: "https://gooddollar.org/fv/link",
      network: "celo-mainnet",
    });

    const service = new GoodDollarFaceVerificationService(clientFactory, {
      getFaceVerificationLink,
    } as never);

    const result = await service.getFaceVerificationLink(CALLBACK);

    expect(clientFactory.getClients).toHaveBeenCalledTimes(1);
    expect(getFaceVerificationLink).toHaveBeenCalledWith({
      publicClient,
      walletClient,
      accountAddress: ACCOUNT,
      callbackUrl: CALLBACK,
    });
    expect(result.link).toBe("https://gooddollar.org/fv/link");
  });
});

import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";
import type { CeloClientFactory, CeloClients } from "../../src/clients/celo-client.js";
import { GoodDollarFaceVerificationService } from "../../src/services/gooddollar-face-verification.service.js";

const requireCjs = createRequire(import.meta.url);

const TEST_WALLET = "0xC1aC9666aa6704758644ee42c9354ce28a43f878" as const;
const CALLBACK_URL = "https://example.com/gooddollar/callback";
const FV_LINK = "https://gooddollar.org/verify?params=abc123";

describe("GoodDollar face verification", () => {
  it("loads @goodsdks/citizen-sdk via createRequire without lz-string ESM errors", () => {
    const citizenSdk = requireCjs("@goodsdks/citizen-sdk") as typeof import("@goodsdks/citizen-sdk");
    const IdentitySDK = citizenSdk.IdentityCustodialSDK ?? citizenSdk.IdentitySDK;

    expect(IdentitySDK).toBeDefined();
    expect(typeof IdentitySDK.init).toBe("function");
  });

  it("getFaceVerificationLink does not fail on citizen-sdk module import", async () => {
    const generateFVLink = vi.fn().mockResolvedValue(FV_LINK);
    const init = vi.fn().mockResolvedValue({ generateFVLink });

    const citizenSdk = requireCjs("@goodsdks/citizen-sdk") as typeof import("@goodsdks/citizen-sdk");
    const IdentitySDK = citizenSdk.IdentityCustodialSDK ?? citizenSdk.IdentitySDK;
    const initSpy = vi.spyOn(IdentitySDK, "init").mockImplementation(init);

    const clients: CeloClients = {
      public: {} as CeloClients["public"],
      wallet: {} as NonNullable<CeloClients["wallet"]>,
      accountAddress: TEST_WALLET,
    };

    const clientFactory = {
      getClients: () => clients,
    } as CeloClientFactory;

    const service = new GoodDollarFaceVerificationService(clientFactory);

    const result = await service.getFaceVerificationLink(CALLBACK_URL);

    expect(initSpy).toHaveBeenCalledOnce();
    expect(generateFVLink).toHaveBeenCalledWith(false, CALLBACK_URL, 42220);
    expect(result).toEqual({
      from: TEST_WALLET,
      callbackUrl: CALLBACK_URL,
      link: FV_LINK,
      network: "celo-mainnet",
    });

    initSpy.mockRestore();
  });
});

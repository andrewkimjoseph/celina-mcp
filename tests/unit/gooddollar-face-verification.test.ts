import { createRequire } from "node:module";
import { createPublicClient, createWalletClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import { describe, expect, it, vi } from "vitest";
import type { CeloClientFactory, CeloClients } from "../../src/clients/celo-client.js";
import { GoodDollarFaceVerificationService } from "../../src/services/gooddollar-face-verification.service.js";

const requireCjs = createRequire(import.meta.url);

const TEST_WALLET = "0xC1aC9666aa6704758644ee42c9354ce28a43f878" as const;
const ROOT = "0x1111111111111111111111111111111111111111" as const;
const CALLBACK_URL = "https://example.com/gooddollar/callback";
const FV_LINK = "https://gooddollar.org/verify?params=abc123";

describe("GoodDollar face verification", () => {
  it("loads @goodsdks/citizen-sdk via createRequire without lz-string ESM errors", () => {
    const citizenSdk = requireCjs("@goodsdks/citizen-sdk") as typeof import("@goodsdks/citizen-sdk");
    const IdentitySDK = citizenSdk.IdentityCustodialSDK ?? citizenSdk.IdentitySDK;

    expect(IdentitySDK).toBeDefined();
    expect(typeof IdentitySDK.init).toBe("function");
  });

  it("direct construction yields IdentityCustodialSDK, not base IdentitySDK", () => {
    const citizenSdk = requireCjs("@goodsdks/citizen-sdk") as typeof import("@goodsdks/citizen-sdk");
    const IdentitySDK = citizenSdk.IdentityCustodialSDK ?? citizenSdk.IdentitySDK;

    const account = privateKeyToAccount(generatePrivateKey());
    const publicClient = createPublicClient({
      chain: celo,
      transport: http("https://forno.celo.org"),
    });
    const wallet = createWalletClient({
      account,
      chain: celo,
      transport: http("https://forno.celo.org"),
    });

    const sdk = new IdentitySDK({
      publicClient: publicClient as never,
      walletClient: wallet as never,
      env: "production",
    });

    expect(sdk.constructor.name).toBe("IdentityCustodialSDK");
  });

  it("skips FV link when signer is whitelisted root", async () => {
    const gooddollar = {
      getIdentityGuidance: vi.fn().mockResolvedValue({
        signerAddress: TEST_WALLET,
        isWhitelistedRoot: true,
        isConnectedWallet: false,
        whitelistedRoot: TEST_WALLET,
        recommendedAction: "connect_secondary",
        message: "Already verified root.",
      }),
    };

    const clients: CeloClients = {
      public: {} as CeloClients["public"],
      wallet: { account: { address: TEST_WALLET }, chain: celo } as NonNullable<
        CeloClients["wallet"]
      >,
      accountAddress: TEST_WALLET,
    };

    const service = new GoodDollarFaceVerificationService(
      { getClients: () => clients } as CeloClientFactory,
      gooddollar as never,
    );

    const result = await service.getFaceVerificationLink(CALLBACK_URL);

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("connect_secondary");
    expect(result.link).toBeUndefined();
    expect(result.guidance?.recommendedAction).toBe("connect_secondary");
  });

  it("generates FV link when signer is unverified", async () => {
    const generateFVLink = vi.fn().mockResolvedValue(FV_LINK);
    const citizenSdk = requireCjs("@goodsdks/citizen-sdk") as typeof import("@goodsdks/citizen-sdk");
    const IdentitySDK = citizenSdk.IdentityCustodialSDK ?? citizenSdk.IdentitySDK;
    vi.spyOn(IdentitySDK.prototype, "generateFVLink").mockImplementation(generateFVLink);

    const gooddollar = {
      getIdentityGuidance: vi.fn().mockResolvedValue({
        signerAddress: TEST_WALLET,
        isWhitelistedRoot: false,
        isConnectedWallet: false,
        recommendedAction: "face_verify",
        message: "Verify this wallet.",
      }),
    };

    const clients: CeloClients = {
      public: {} as CeloClients["public"],
      wallet: { account: { address: TEST_WALLET }, chain: celo } as NonNullable<
        CeloClients["wallet"]
      >,
      accountAddress: TEST_WALLET,
    };

    const service = new GoodDollarFaceVerificationService(
      { getClients: () => clients } as CeloClientFactory,
      gooddollar as never,
    );

    const result = await service.getFaceVerificationLink(CALLBACK_URL);

    expect(result.skipped).toBeUndefined();
    expect(result.link).toBe(FV_LINK);
    expect(generateFVLink).toHaveBeenCalledWith(false, CALLBACK_URL, 42220);
    expect(result.guidance?.recommendedAction).toBe("face_verify");
  });

  it("skips FV link when signer is connected to whitelisted root", async () => {
    const gooddollar = {
      getIdentityGuidance: vi.fn().mockResolvedValue({
        signerAddress: TEST_WALLET,
        isWhitelistedRoot: false,
        isConnectedWallet: true,
        whitelistedRoot: ROOT,
        connectedTo: ROOT,
        recommendedAction: "already_verified",
        message: "Linked to root.",
      }),
    };

    const clients: CeloClients = {
      public: {} as CeloClients["public"],
      wallet: { account: { address: TEST_WALLET }, chain: celo } as NonNullable<
        CeloClients["wallet"]
      >,
      accountAddress: TEST_WALLET,
    };

    const service = new GoodDollarFaceVerificationService(
      { getClients: () => clients } as CeloClientFactory,
      gooddollar as never,
    );

    const result = await service.getFaceVerificationLink(CALLBACK_URL);

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe("already_verified");
    expect(result.guidance?.whitelistedRoot).toBe(ROOT);
  });
});

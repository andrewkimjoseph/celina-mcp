import { createRequire } from "node:module";
import { requireWalletClients } from "./execute-prepared-flow.js";
import type { CeloClientFactory } from "../clients/celo-client.js";

const requireCjs = createRequire(import.meta.url);

/**
 * Generate a GoodDollar face verification link via @goodsdks/citizen-sdk.
 * Requires a configured wallet client with a local account (CELO_PRIVATE_KEY or SELF_AGENT_PRIVATE_KEY).
 */
export class GoodDollarFaceVerificationService {
  constructor(private readonly clientFactory: CeloClientFactory) {}

  async getFaceVerificationLink(callbackUrl: string) {
    const { wallet, public: publicClient, accountAddress } = requireWalletClients(
      this.clientFactory.getClients(),
    );

    const citizenSdk = requireCjs("@goodsdks/citizen-sdk") as typeof import("@goodsdks/citizen-sdk");
    const IdentitySDK = citizenSdk.IdentityCustodialSDK ?? citizenSdk.IdentitySDK;
    if (!IdentitySDK) {
      throw new Error("@goodsdks/citizen-sdk IdentitySDK export not found.");
    }

    // Use direct construction — IdentitySDK.init() always returns the base class
    // and signs via RPC personal_sign, which Forno does not support.
    const sdk = new IdentitySDK({
      publicClient: publicClient as never,
      walletClient: wallet as never,
      env: "production",
    });

    const link = await sdk.generateFVLink(false, callbackUrl, 42220);

    return {
      from: accountAddress,
      callbackUrl,
      link,
      network: "celo-mainnet" as const,
    };
  }
}

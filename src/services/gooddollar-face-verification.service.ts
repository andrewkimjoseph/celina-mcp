import { createRequire } from "node:module";
import { requireWalletClients } from "./execute-prepared-flow.js";
import type { CeloClientFactory } from "../clients/celo-client.js";

const requireCjs = createRequire(import.meta.url);

/**
 * Generate a GoodDollar face verification link via @goodsdks/citizen-sdk.
 * Requires a configured wallet client for IdentitySDK.init.
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

    const sdk = await IdentitySDK.init({
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

import { createRequire } from "node:module";
import { shouldSkipFaceVerification } from "@andrewkimjoseph/celina-sdk";
import type { createCelinaClient } from "@andrewkimjoseph/celina-sdk";
import { requireWalletClients } from "./execute-prepared-flow.js";
import type { CeloClientFactory } from "../clients/celo-client.js";

const requireCjs = createRequire(import.meta.url);

type CelinaClient = ReturnType<typeof createCelinaClient>;

export type FaceVerificationLinkResult = {
  from: `0x${string}`;
  callbackUrl: string;
  link?: string;
  network: "celo-mainnet";
  skipped?: boolean;
  reason?: string;
  guidance?: {
    recommendedAction: string;
    message: string;
    whitelistedRoot?: `0x${string}`;
    connectedTo?: `0x${string}`;
  };
};

/**
 * Generate a GoodDollar face verification link via @goodsdks/citizen-sdk.
 * Requires a configured wallet client with a local account (CELO_PRIVATE_KEY or SELF_AGENT_PRIVATE_KEY).
 */
export class GoodDollarFaceVerificationService {
  constructor(
    private readonly clientFactory: CeloClientFactory,
    private readonly gooddollar: CelinaClient["gooddollar"],
  ) {}

  async getFaceVerificationLink(callbackUrl: string): Promise<FaceVerificationLinkResult> {
    const { wallet, public: publicClient, accountAddress } = requireWalletClients(
      this.clientFactory.getClients(),
    );

    const guidance = await this.gooddollar.getIdentityGuidance(accountAddress);

    if (shouldSkipFaceVerification(guidance)) {
      return {
        from: accountAddress,
        callbackUrl,
        network: "celo-mainnet",
        skipped: true,
        reason: guidance.recommendedAction,
        guidance: {
          recommendedAction: guidance.recommendedAction,
          message: guidance.message,
          whitelistedRoot: guidance.whitelistedRoot,
          connectedTo: guidance.connectedTo,
        },
      };
    }

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
      network: "celo-mainnet",
      guidance: {
        recommendedAction: guidance.recommendedAction,
        message: guidance.message,
      },
    };
  }
}

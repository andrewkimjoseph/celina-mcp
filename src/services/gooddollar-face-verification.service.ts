import type { FaceVerificationLinkResult } from "@andrewkimjoseph/celina-sdk";
import type { createCelinaClient } from "@andrewkimjoseph/celina-sdk";
import { requireWalletClients } from "./execute-prepared-flow.js";
import type { CeloClientFactory } from "../clients/celo-client.js";

type CelinaClient = ReturnType<typeof createCelinaClient>;

/**
 * MCP adapter: resolves configured wallet clients, then delegates link generation to celina-sdk.
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

    return this.gooddollar.getFaceVerificationLink({
      publicClient: publicClient as Parameters<
        CelinaClient["gooddollar"]["getFaceVerificationLink"]
      >[0]["publicClient"],
      walletClient: wallet as Parameters<
        CelinaClient["gooddollar"]["getFaceVerificationLink"]
      >[0]["walletClient"],
      accountAddress,
      callbackUrl,
    });
  }
}

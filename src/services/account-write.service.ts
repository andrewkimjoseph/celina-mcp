import { type createCelinaClient } from "@andrewkimjoseph/celina-sdk";
import type { CeloClientFactory, SignerKind } from "../clients/celo-client.js";
import { executePreparedFlow, requireWalletClients } from "./execute-prepared-flow.js";

type CelinaClient = ReturnType<typeof createCelinaClient>;

export class AccountWriteService {
  constructor(
    private readonly clientFactory: CeloClientFactory,
    private readonly sdk: CelinaClient,
  ) {}

  async registerAccount(signer?: SignerKind) {
    const clients = requireWalletClients(this.clientFactory.getClients(signer));
    const { accountAddress: from } = clients;

    const prepared = await this.sdk.account.prepareRegisterAccount(from);
    const result = await executePreparedFlow(this.clientFactory, prepared.steps, signer);

    return { from, ...result };
  }
}

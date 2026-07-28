import { type createCelinaClient } from "@andrewkimjoseph/celina-sdk";
import type { CeloClientFactory, SignerKind } from "../clients/celo-client.js";
import { executePreparedFlow, requireWalletClients } from "./execute-prepared-flow.js";

type CelinaClient = ReturnType<typeof createCelinaClient>;

export class GoodDollarIdentityWriteService {
  constructor(
    private readonly clientFactory: CeloClientFactory,
    private readonly sdk: CelinaClient,
  ) {}

  async connectIdentity(connectedAccount: `0x${string}`, signer?: SignerKind) {
    const clients = requireWalletClients(this.clientFactory.getClients(signer));
    const { accountAddress: from } = clients;

    const prepared = await this.sdk.gooddollar.prepareConnectIdentity(
      from,
      connectedAccount,
    );
    const result = await executePreparedFlow(this.clientFactory, prepared.steps, signer);

    return { from, connectedAccount, ...result };
  }

  async disconnectIdentity(connectedAccount: `0x${string}`, signer?: SignerKind) {
    const clients = requireWalletClients(this.clientFactory.getClients(signer));
    const { accountAddress: from } = clients;

    const prepared = await this.sdk.gooddollar.prepareDisconnectIdentity(
      from,
      connectedAccount,
    );
    const result = await executePreparedFlow(this.clientFactory, prepared.steps, signer);

    return { from, connectedAccount, ...result };
  }
}

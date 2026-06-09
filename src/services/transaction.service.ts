import type { createCelinaClient } from "@andrewkimjoseph/celina-sdk";
import type { CeloClientFactory } from "../clients/celo-client.js";
import { executePreparedFlow, requireWalletClients } from "./execute-prepared-flow.js";

type CelinaClient = ReturnType<typeof createCelinaClient>;

type SendEstimateResult = {
  network: "mainnet";
  from: `0x${string}`;
  to: `0x${string}`;
  token: string;
  amount: string;
  gas: string | null;
  insufficientBalance?: boolean;
  message?: string;
};

export class TransactionService {
  constructor(
    private readonly clientFactory: CeloClientFactory,
    private readonly sdk: CelinaClient,
  ) {}

  async estimateSend(
    to: `0x${string}`,
    token: string,
    amount: string,
  ): Promise<SendEstimateResult> {
    const { accountAddress: from } = requireWalletClients(
      this.clientFactory.getClients(),
    );
    return this.sdk.transaction.estimateSend(from, to, token, amount);
  }

  async sendToken(to: `0x${string}`, token: string, amount: string) {
    const clients = requireWalletClients(this.clientFactory.getClients());
    const { accountAddress: from } = clients;

    const prepared = await this.sdk.transaction.prepareSend(from, to, token, amount);
    const { hash, status } = await executePreparedFlow(clients, prepared.steps);

    const resolved = await this.sdk.token.resolveToken(token);

    return {
      network: "mainnet" as const,
      hash,
      status,
      from,
      to,
      token: resolved.symbol,
      amount,
    };
  }
}

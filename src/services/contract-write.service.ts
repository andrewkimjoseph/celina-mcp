import type { createCelinaClient } from "@andrewkimjoseph/celina-sdk";
import type { Abi } from "viem";
import type { CeloClientFactory } from "../clients/celo-client.js";
import { executePreparedFlow, requireWalletClients } from "./execute-prepared-flow.js";

type CelinaClient = ReturnType<typeof createCelinaClient>;

export class ContractWriteService {
  constructor(
    private readonly clientFactory: CeloClientFactory,
    private readonly sdk: CelinaClient,
  ) {}

  async executeFunction(params: {
    contractAddress: `0x${string}`;
    functionName: string;
    abi: Abi;
    functionArgs?: unknown[];
    value?: string;
  }) {
    const clients = requireWalletClients(this.clientFactory.getClients());
    const { accountAddress: from } = clients;

    const prepared = await this.sdk.contract.prepareFunction(from, {
      contractAddress: params.contractAddress,
      functionName: params.functionName,
      abi: params.abi,
      functionArgs: params.functionArgs,
      value: params.value,
    });
    const { hash, status } = await executePreparedFlow(clients, prepared.steps);

    return {
      network: "mainnet" as const,
      hash,
      status,
      from,
      contractAddress: params.contractAddress,
      functionName: params.functionName,
    };
  }
}

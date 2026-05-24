import type { CeloClientFactory } from "../clients/celo-client.js";

export class AccountService {
  constructor(private readonly clientFactory: CeloClientFactory) {}

  async getAccount(address: `0x${string}`) {
    const { public: client } = this.clientFactory.getClients();
    const [balance, nonce, bytecode] = await Promise.all([
      client.getBalance({ address }),
      client.getTransactionCount({ address }),
      client.getCode({ address }),
    ]);

    return {
      address,
      network: "mainnet",
      balanceWei: balance.toString(),
      balanceCelo: Number(balance) / 1e18,
      nonce,
      isContract: bytecode !== undefined && bytecode !== "0x",
    };
  }
}

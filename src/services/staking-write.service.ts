import {
  assertHumanness,
  type createCelinaClient,
} from "@andrewkimjoseph/celina-sdk";
import type { CeloClientFactory, SignerKind } from "../clients/celo-client.js";
import { executePreparedFlow } from "./execute-prepared-flow.js";

type CelinaClient = ReturnType<typeof createCelinaClient>;

export class StakingWriteService {
  constructor(
    private readonly clientFactory: CeloClientFactory,
    private readonly sdk: CelinaClient,
  ) {}

  private async executeHumannessGated(
    signer: SignerKind | undefined,
    prepare: (from: `0x${string}`) => Promise<{ steps: import("@andrewkimjoseph/celina-sdk").PreparedTx[] }>,
  ) {
    const clients = this.clientFactory.getClients(signer);
    const from = clients.accountAddress;
    if (!from) {
      throw new Error("No wallet address available for signing.");
    }

    const humanness = await this.sdk.humanness.checkHumanness(from);
    assertHumanness(humanness);

    const prepared = await prepare(from);
    const result = await executePreparedFlow(this.clientFactory, prepared.steps, signer);

    return {
      from,
      humanness,
      ...result,
    };
  }

  stake(groupAddress: `0x${string}`, amount: string, signer?: SignerKind) {
    return this.executeHumannessGated(signer, (from) =>
      this.sdk.staking.prepareStake(from, groupAddress, amount),
    );
  }

  activateStake(groupAddress: `0x${string}`, signer?: SignerKind) {
    return this.executeHumannessGated(signer, (from) =>
      this.sdk.staking.prepareActivateStake(from, groupAddress),
    );
  }

  unstake(groupAddress: `0x${string}`, amount: string, signer?: SignerKind) {
    return this.executeHumannessGated(signer, (from) =>
      this.sdk.staking.prepareUnstake(from, groupAddress, amount),
    );
  }

  delegatePower(delegatee: `0x${string}`, percent: number, signer?: SignerKind) {
    return this.executeHumannessGated(signer, (from) =>
      this.sdk.staking.prepareDelegatePower(from, delegatee, percent),
    );
  }

  undelegatePower(delegatee: `0x${string}`, percent: number, signer?: SignerKind) {
    return this.executeHumannessGated(signer, (from) =>
      this.sdk.staking.prepareUndelegatePower(from, delegatee, percent),
    );
  }
}

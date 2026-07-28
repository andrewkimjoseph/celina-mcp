import {
  assertHumanness,
  type createCelinaClient,
  type VoteValueName,
} from "@andrewkimjoseph/celina-sdk";
import type { CeloClientFactory, SignerKind } from "../clients/celo-client.js";
import { executePreparedFlow } from "./execute-prepared-flow.js";

type CelinaClient = ReturnType<typeof createCelinaClient>;

export class GovernanceWriteService {
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

  lockCelo(amount: string, signer?: SignerKind) {
    return this.executeHumannessGated(signer, (from) =>
      this.sdk.governance.prepareLockCelo(from, amount),
    );
  }

  unlockCelo(amount: string, signer?: SignerKind) {
    return this.executeHumannessGated(signer, (from) =>
      this.sdk.governance.prepareUnlockCelo(from, amount),
    );
  }

  relockCelo(index: number, amount: string, signer?: SignerKind) {
    return this.executeHumannessGated(signer, (from) =>
      this.sdk.governance.prepareRelockCelo(from, index, amount),
    );
  }

  withdrawCelo(signer?: SignerKind) {
    return this.executeHumannessGated(signer, (from) =>
      this.sdk.governance.prepareWithdrawCelo(from),
    );
  }

  vote(proposalId: number, vote: VoteValueName, signer?: SignerKind) {
    return this.executeHumannessGated(signer, (from) =>
      this.sdk.governance.prepareVote(from, proposalId, vote),
    );
  }
}

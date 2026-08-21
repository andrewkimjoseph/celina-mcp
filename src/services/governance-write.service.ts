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

  upvote(proposalId: number, signer?: SignerKind) {
    return this.executeHumannessGated(signer, (from) =>
      this.sdk.governance.prepareUpvote(from, proposalId),
    );
  }

  async dequeueProposalsIfReady(signer?: SignerKind) {
    const clients = this.clientFactory.getClients(signer);
    const from = clients.accountAddress;
    if (!from) {
      throw new Error("No wallet address available for signing.");
    }

    const prepared = await this.sdk.governance.prepareDequeueProposalsIfReady(from);
    const result = await executePreparedFlow(this.clientFactory, prepared.steps, signer);

    return {
      from,
      ...result,
    };
  }

  revokeGovernanceVotes(signer?: SignerKind) {
    return this.executeHumannessGated(signer, (from) =>
      this.sdk.governance.prepareRevokeGovernanceVotes(from),
    );
  }

  revokeGovernanceUpvote(proposalId?: number, signer?: SignerKind) {
    return this.executeHumannessGated(signer, (from) =>
      this.sdk.governance.prepareRevokeGovernanceUpvote(from, { proposalId }),
    );
  }
}

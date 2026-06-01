import {
  GOODDOLLAR_UBI_SCHEME_ADDRESS,
  type createCelinaClient,
} from "@andrewkimjoseph/celina-sdk";
import { decodeEventLog, formatUnits } from "viem";
import type { CeloClientFactory } from "../clients/celo-client.js";
import { executePreparedFlow, requireWalletClients } from "./execute-prepared-flow.js";

type CelinaClient = ReturnType<typeof createCelinaClient>;

const ubiClaimedEvent = {
  type: "event",
  name: "UBIClaimed",
  inputs: [
    { name: "claimer", type: "address", indexed: true },
    { name: "amount", type: "uint256", indexed: false },
  ],
} as const;

export class GoodDollarWriteService {
  constructor(
    private readonly clientFactory: CeloClientFactory,
    private readonly sdk: CelinaClient,
  ) {}

  async claimDailyUbi() {
    const clients = requireWalletClients(this.clientFactory.getClients());
    const { accountAddress: from } = clients;

    const eligibility = await this.sdk.gooddollar.getUbiClaimEligibility(from);
    const prepared = await this.sdk.gooddollar.prepareClaimUbi(from);
    const { hash } = await executePreparedFlow(clients, prepared.steps);

    const receipt = await clients.public.waitForTransactionReceipt({ hash });
    let amountClaimed: string | undefined;
    let amountClaimedFormatted: string | undefined;

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== GOODDOLLAR_UBI_SCHEME_ADDRESS.toLowerCase()) {
        continue;
      }
      try {
        const decoded = decodeEventLog({
          abi: [ubiClaimedEvent],
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "UBIClaimed") {
          const amount = decoded.args.amount as bigint;
          amountClaimed = amount.toString();
          amountClaimedFormatted = `${formatUnits(amount, 18)} G$`;
          break;
        }
      } catch {
        // ignore unrelated logs
      }
    }

    return {
      from,
      hash,
      contract: GOODDOLLAR_UBI_SCHEME_ADDRESS,
      operation: "CLAIM_UBI" as const,
      whitelistedRoot: eligibility.whitelistedRoot,
      claimableAmount: eligibility.claimableAmount,
      claimableAmountFormatted: eligibility.claimableAmountFormatted,
      amountClaimed,
      amountClaimedFormatted,
    };
  }
}

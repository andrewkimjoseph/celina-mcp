import {
  type createCelinaClient,
  type CarbonPrepareResult,
  type CarbonWriteBody,
  carbonActivityDeepLink,
} from "@andrewkimjoseph/celina-sdk";
import type { CeloClientFactory } from "../clients/celo-client.js";
import { executePreparedFlow, requireWalletClients } from "./execute-prepared-flow.js";

type CelinaClient = ReturnType<typeof createCelinaClient>;

type PrepareFn = (
  body: CarbonWriteBody,
) => Promise<CarbonPrepareResult>;

export class CarbonWriteService {
  constructor(
    private readonly clientFactory: CeloClientFactory,
    private readonly sdk: CelinaClient,
  ) {}

  private assertWalletMatch(
    from: `0x${string}`,
    body: Record<string, unknown>,
  ): void {
    const requested = body.wallet_address as string | undefined;
    if (requested && requested.toLowerCase() !== from.toLowerCase()) {
      throw new Error(
        `wallet_address ${requested} does not match CELO_PRIVATE_KEY signer ${from}. Omit wallet_address on execute_carbon_* tools.`,
      );
    }
  }

  private async executePreparedCarbon(
    prepareFn: PrepareFn,
    body: Record<string, unknown>,
    label: string,
  ) {
    const clients = requireWalletClients(this.clientFactory.getClients());
    const { accountAddress: from } = clients;
    this.assertWalletMatch(from, body);

    const writeBody = { ...body, wallet_address: from } as CarbonWriteBody;
    const prepared = await prepareFn(writeBody);
    const steps = await this.sdk.carbon.buildExecutionSteps(
      from,
      prepared,
      writeBody,
    );
    const { stepHashes, hash, status } = await executePreparedFlow(
      clients,
      steps,
    );

    return {
      from,
      operation: label,
      stepHashes,
      hash,
      status,
      warnings: prepared.warnings,
      deep_link: carbonActivityDeepLink(from),
      ...(prepared.strategyPreview !== undefined
        ? { strategyPreview: prepared.strategyPreview }
        : {}),
      ...(prepared.preparedFlow ? { preparedFlow: prepared.preparedFlow } : {}),
    };
  }

  executeLimitOrder(body: Record<string, unknown>) {
    return this.executePreparedCarbon(
      (b) => this.sdk.carbon.prepareLimitOrder(b),
      body,
      "execute_carbon_limit_order",
    );
  }

  executeRangeOrder(body: Record<string, unknown>) {
    return this.executePreparedCarbon(
      (b) => this.sdk.carbon.prepareRangeOrder(b),
      body,
      "execute_carbon_range_order",
    );
  }

  executeRecurringStrategy(body: Record<string, unknown>) {
    return this.executePreparedCarbon(
      (b) => this.sdk.carbon.prepareRecurringStrategy(b),
      body,
      "execute_carbon_recurring_strategy",
    );
  }

  executeConcentratedStrategy(body: Record<string, unknown>) {
    return this.executePreparedCarbon(
      (b) => this.sdk.carbon.prepareConcentratedStrategy(b),
      body,
      "execute_carbon_concentrated_strategy",
    );
  }

  executeFullRangeStrategy(body: Record<string, unknown>) {
    return this.executePreparedCarbon(
      (b) => this.sdk.carbon.prepareFullRangeStrategy(b),
      body,
      "execute_carbon_full_range_strategy",
    );
  }

  executeRepriceStrategy(body: Record<string, unknown>) {
    return this.executePreparedCarbon(
      (b) => this.sdk.carbon.prepareRepriceStrategy(b),
      body,
      "execute_carbon_reprice_strategy",
    );
  }

  executeEditStrategy(body: Record<string, unknown>) {
    return this.executePreparedCarbon(
      (b) => this.sdk.carbon.prepareEditStrategy(b),
      body,
      "execute_carbon_edit_strategy",
    );
  }

  executeDepositBudget(body: Record<string, unknown>) {
    return this.executePreparedCarbon(
      (b) => this.sdk.carbon.prepareDepositBudget(b),
      body,
      "execute_carbon_deposit_budget",
    );
  }

  executeWithdrawBudget(body: Record<string, unknown>) {
    return this.executePreparedCarbon(
      (b) => this.sdk.carbon.prepareWithdrawBudget(b),
      body,
      "execute_carbon_withdraw_budget",
    );
  }

  executePauseStrategy(body: Record<string, unknown>) {
    return this.executePreparedCarbon(
      (b) => this.sdk.carbon.preparePauseStrategy(b),
      body,
      "execute_carbon_pause_strategy",
    );
  }

  executeResumeStrategy(body: Record<string, unknown>) {
    return this.executePreparedCarbon(
      (b) => this.sdk.carbon.prepareResumeStrategy(b),
      body,
      "execute_carbon_resume_strategy",
    );
  }

  executeDeleteStrategy(body: Record<string, unknown>) {
    return this.executePreparedCarbon(
      (b) => this.sdk.carbon.prepareDeleteStrategy(b),
      body,
      "execute_carbon_delete_strategy",
    );
  }

  executeTrade(body: Record<string, unknown>) {
    return this.executePreparedCarbon(
      (b) => this.sdk.carbon.prepareTrade(b),
      body,
      "execute_carbon_trade",
    );
  }
}

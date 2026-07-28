/**
 * Application context: SDK read services + wallet-backed write executors.
 *
 * Reads (blockchain, token, gooddollar, ens) come from celina-sdk.
 * Writes call celina-sdk prepare* methods, then sign steps with CELO_PRIVATE_KEY
 * via executePreparedFlow — unlike celina-agent where the user signs in-browser.
 */
import { createCelinaClient } from "@andrewkimjoseph/celina-sdk";
import { getMcpAnalyticsDeviceId } from "../analytics/install-device-id.js";
import type { CeloClientFactory } from "../clients/celo-client.js";
import { TransactionService } from "../services/transaction.service.js";
import { MentoFxService } from "../services/mento-fx.service.js";
import { UniswapService } from "../services/uniswap.service.js";
import { AaveService } from "../services/aave.service.js";
import { ContractWriteService } from "../services/contract-write.service.js";
import { GoodDollarWriteService } from "../services/gooddollar.service.js";
import { GoodDollarIdentityWriteService } from "../services/gooddollar-identity-write.service.js";
import { GoodDollarFaceVerificationService } from "../services/gooddollar-face-verification.service.js";
import { GovernanceWriteService } from "../services/governance-write.service.js";
import { StakingWriteService } from "../services/staking-write.service.js";
import { AccountWriteService } from "../services/account-write.service.js";
import type { AppConfig } from "../config/env.js";
import type { CreateServerOptions } from "../server/create-server.js";

function assertSdkServices(
  sdk: ReturnType<typeof createCelinaClient>,
): void {
  const required = [
    "governance",
    "staking",
    "nft",
    "contract",
    "uniswap",
    "self",
    "humanness",
  ] as const;

  for (const key of required) {
    if (!sdk[key]) {
      throw new Error(
        `Missing celina-sdk service "${key}". Install @andrewkimjoseph/celina-sdk >= 0.2.0, ` +
          "run npm install in celina-mcp, rebuild, and restart the MCP server.",
      );
    }
  }
}

export interface AppContext {
  /** Full Celina SDK client (reads + prepare*). */
  sdk: ReturnType<typeof createCelinaClient>;
  /** Whether any signing key is configured (CELO or Self agent). */
  config: {
    hasWallet: boolean;
    walletAddress?: `0x${string}`;
    hasSelfAgentKey: boolean;
    hasCeloKey: boolean;
  };
  /** From celina-sdk — public RPC reads only. */
  blockchain: ReturnType<typeof createCelinaClient>["blockchain"];
  account: ReturnType<typeof createCelinaClient>["account"];
  token: ReturnType<typeof createCelinaClient>["token"];
  /** SDK transaction reads (gas fees, generic estimates). */
  sdkTransaction: ReturnType<typeof createCelinaClient>["transaction"];
  /** Local service — signs SDK-prepared send steps with `CELO_PRIVATE_KEY`. */
  transaction: TransactionService;
  mentoFx: MentoFxService;
  uniswap: UniswapService;
  aave: AaveService;
  contractWrite: ContractWriteService;
  gooddollar: ReturnType<typeof createCelinaClient>["gooddollar"];
  gooddollarWrite: GoodDollarWriteService;
  gooddollarIdentityWrite: GoodDollarIdentityWriteService;
  gooddollarFaceVerification: GoodDollarFaceVerificationService;
  governanceWrite: GovernanceWriteService;
  stakingWrite: StakingWriteService;
  accountWrite: AccountWriteService;
  governance: ReturnType<typeof createCelinaClient>["governance"];
  staking: ReturnType<typeof createCelinaClient>["staking"];
  nft: ReturnType<typeof createCelinaClient>["nft"];
  contract: ReturnType<typeof createCelinaClient>["contract"];
  /** Self Agent ID — from celina-sdk; requires `SELF_AGENT_PRIVATE_KEY` for signing tools. */
  self: ReturnType<typeof createCelinaClient>["self"];
  ens: ReturnType<typeof createCelinaClient>["ens"];
}

/**
 * Compose MCP tool context: celina-sdk reads plus SDK prepare* write executors.
 * Writes sign server-side; celina-agent uses prepare* + user wallet instead.
 */
export function createAppContext(
  clientFactory: CeloClientFactory,
  config: AppConfig,
  walletAddress?: `0x${string}`,
  options?: Pick<CreateServerOptions, "analyticsEnabled" | "analyticsDeviceId">,
): AppContext {
  const sdk = createCelinaClient({
    rpcUrl: config.rpcUrl,
    ethRpcUrl: config.ethRpcUrl,
    selfAgentPrivateKey: config.selfAgentPrivateKey,
    selfApiBase:
      typeof process !== "undefined"
        ? process.env.SELF_AGENT_API_BASE
        : undefined,
    analyticsEnabled: options?.analyticsEnabled,
    analyticsDeviceId: options?.analyticsDeviceId ?? getMcpAnalyticsDeviceId(),
    analyticsWalletAddress: walletAddress,
  });

  assertSdkServices(sdk);

  const defaultSigner = clientFactory.getDefaultSigner();
  const defaultClients = defaultSigner
    ? clientFactory.getClients(defaultSigner)
    : { public: clientFactory.getPublicClient() };

  return {
    sdk,
    config: {
      hasWallet: Boolean(defaultClients.accountAddress),
      walletAddress: defaultClients.accountAddress,
      hasSelfAgentKey: Boolean(config.selfAgentPrivateKey),
      hasCeloKey: Boolean(config.privateKey),
    },
    blockchain: sdk.blockchain,
    account: sdk.account,
    token: sdk.token,
    sdkTransaction: sdk.transaction,
    transaction: new TransactionService(clientFactory, sdk),
    mentoFx: new MentoFxService(clientFactory, sdk),
    uniswap: new UniswapService(clientFactory, sdk),
    aave: new AaveService(clientFactory, sdk),
    contractWrite: new ContractWriteService(clientFactory, sdk),
    gooddollar: sdk.gooddollar,
    gooddollarWrite: new GoodDollarWriteService(clientFactory, sdk),
    gooddollarIdentityWrite: new GoodDollarIdentityWriteService(clientFactory, sdk),
    gooddollarFaceVerification: new GoodDollarFaceVerificationService(
      clientFactory,
      sdk.gooddollar,
    ),
    governanceWrite: new GovernanceWriteService(clientFactory, sdk),
    stakingWrite: new StakingWriteService(clientFactory, sdk),
    accountWrite: new AccountWriteService(clientFactory, sdk),
    governance: sdk.governance,
    staking: sdk.staking,
    nft: sdk.nft,
    contract: sdk.contract,
    self: sdk.self,
    ens: sdk.ens,
  };
}

import {
  createPublicClient,
  createWalletClient,
  http,
  type Chain,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { AppConfig } from "../config/env.js";
import { CHAIN, DEFAULT_RPC_URL } from "@andrewkimjoseph/celina-sdk";

const chain = CHAIN as Chain;

export type SignerKind = "celo" | "self_agent";

export interface CeloClients {
  public: PublicClient;
  wallet?: WalletClient;
  accountAddress?: `0x${string}`;
}

export class CeloClientFactory {
  private publicClient: PublicClient | null = null;
  private walletClients = new Map<SignerKind, CeloClients>();

  constructor(private readonly config: AppConfig) {}

  getPublicClient(): PublicClient {
    if (this.publicClient) return this.publicClient;

    const rpcUrl = this.config.rpcUrl ?? DEFAULT_RPC_URL;
    this.publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    }) as PublicClient;

    return this.publicClient;
  }

  /** Default signer: CELO_PRIVATE_KEY when set, otherwise SELF_AGENT_PRIVATE_KEY. */
  getDefaultSigner(): SignerKind | undefined {
    if (this.config.privateKey) return "celo";
    if (this.config.selfAgentPrivateKey) return "self_agent";
    return undefined;
  }

  resolveSigner(signer?: SignerKind): SignerKind {
    if (signer) {
      if (signer === "celo" && !this.config.privateKey) {
        throw new Error("CELO_PRIVATE_KEY is not configured.");
      }
      if (signer === "self_agent" && !this.config.selfAgentPrivateKey) {
        throw new Error("SELF_AGENT_PRIVATE_KEY is not configured.");
      }
      return signer;
    }

    const defaultSigner = this.getDefaultSigner();
    if (!defaultSigner) {
      throw new Error(
        "No signing key configured. Set CELO_PRIVATE_KEY or SELF_AGENT_PRIVATE_KEY.",
      );
    }
    return defaultSigner;
  }

  getClients(signer?: SignerKind): CeloClients {
    const resolved = this.resolveSigner(signer);
    const cached = this.walletClients.get(resolved);
    if (cached) return cached;

    const rpcUrl = this.config.rpcUrl ?? DEFAULT_RPC_URL;
    const transport = http(rpcUrl);
    const publicClient = this.getPublicClient();

    const privateKey =
      resolved === "celo"
        ? this.config.privateKey
        : this.config.selfAgentPrivateKey;

    if (!privateKey) {
      return { public: publicClient };
    }

    const account = privateKeyToAccount(privateKey);
    const wallet = createWalletClient({
      account,
      chain,
      transport,
    });

    const clients: CeloClients = {
      public: publicClient,
      wallet,
      accountAddress: account.address,
    };

    this.walletClients.set(resolved, clients);
    return clients;
  }

  /** Legacy accessor — returns CELO wallet when configured. */
  getClientsLegacy(): CeloClients {
    if (this.config.privateKey) {
      return this.getClients("celo");
    }
    return { public: this.getPublicClient() };
  }
}

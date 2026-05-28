import { erc20Abi, formatUnits, parseUnits } from "viem";
import {
  findKnownToken,
  KNOWN_TOKEN_SYMBOLS,
  resolveStablecoins,
} from "../config/chains.js";
import type { CeloClientFactory } from "../clients/celo-client.js";

export interface ResolvedToken {
  address: `0x${string}` | "native";
  symbol: string;
  decimals: number;
}

export class TokenService {
  constructor(private readonly clientFactory: CeloClientFactory) {}

  resolveToken(token: string): ResolvedToken {
    const known = findKnownToken(token.trim());
    if (!known) {
      throw new Error(
        `Unknown token "${token}" on Celo mainnet. Use ${KNOWN_TOKEN_SYMBOLS.join(", ")}.`,
      );
    }

    return {
      address: known.address,
      symbol: known.symbol,
      decimals: known.decimals,
    };
  }

  async getTokenInfo(token: string) {
    const resolved = this.resolveToken(token);

    return {
      network: "mainnet" as const,
      address: resolved.address,
      name: resolved.address === "native" ? "Celo" : resolved.symbol,
      symbol: resolved.symbol,
      decimals: resolved.decimals,
    };
  }

  async getBalances(
    address: `0x${string}`,
    tokens: string[] = ["CELO", "USDm"],
  ) {
    const { public: client } = this.clientFactory.getClients();

    const balances = await Promise.all(
      tokens.map(async (tokenInput) => {
        const token = this.resolveToken(tokenInput);

        if (token.address === "native") {
          const balance = await client.getBalance({ address });
          return {
            token: token.symbol,
            address: "native" as const,
            raw: balance.toString(),
            formatted: formatUnits(balance, token.decimals),
          };
        }

        const balance = await client.readContract({
          address: token.address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        });

        return {
          token: token.symbol,
          address: token.address,
          raw: balance.toString(),
          formatted: formatUnits(balance, token.decimals),
        };
      }),
    );

    return { network: "mainnet" as const, address, balances };
  }

  async getStablecoinBalances(
    address: `0x${string}`,
    options?: {
      stablecoins?: string[];
      includeZero?: boolean;
    },
  ) {
    const coins = resolveStablecoins(options?.stablecoins);
    const { public: client } = this.clientFactory.getClients();

    const results = await client.multicall({
      contracts: coins.map((coin) => ({
        address: coin.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      })),
      allowFailure: true,
    });

    const balances = coins.map((coin, index) => {
      const result = results[index];

      if (result.status === "failure") {
        return {
          symbol: coin.symbol,
          address: coin.address,
          issuer: coin.issuer,
          useCase: coin.useCase,
          raw: "0",
          formatted: "0",
          readError: true,
        };
      }

      const raw = result.result as bigint;
      return {
        symbol: coin.symbol,
        address: coin.address,
        issuer: coin.issuer,
        useCase: coin.useCase,
        raw: raw.toString(),
        formatted: formatUnits(raw, coin.decimals),
      };
    });

    const stablecoins = options?.includeZero
      ? balances
      : balances.filter((balance) => balance.raw !== "0");

    return {
      network: "mainnet",
      address,
      totalChecked: coins.length,
      stablecoins,
    };
  }

  async getTokenBalance(token: string, accountAddress: `0x${string}`) {
    const resolved = this.resolveToken(token);
    const { public: client } = this.clientFactory.getClients();

    if (resolved.address === "native") {
      const balance = await client.getBalance({ address: accountAddress });
      return {
        network: "mainnet" as const,
        tokenAddress: "native" as const,
        accountAddress,
        name: "Celo",
        symbol: "CELO",
        decimals: resolved.decimals,
        raw: balance.toString(),
        formatted: formatUnits(balance, resolved.decimals),
      };
    }

    const balance = await client.readContract({
      address: resolved.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [accountAddress],
    });

    return {
      network: "mainnet" as const,
      tokenAddress: resolved.address,
      accountAddress,
      name: resolved.symbol,
      symbol: resolved.symbol,
      decimals: resolved.decimals,
      raw: balance.toString(),
      formatted: formatUnits(balance, resolved.decimals),
    };
  }

  parseAmount(amount: string, decimals: number): bigint {
    return parseUnits(amount, decimals);
  }
}

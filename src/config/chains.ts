import { celo, celoSepolia } from "viem/chains";
import type { Chain } from "viem";
import type { CeloNetwork } from "./env.js";

export const CHAINS: Record<CeloNetwork, Chain> = {
  mainnet: celo,
  sepolia: celoSepolia,
};

export const DEFAULT_RPC_URLS: Record<CeloNetwork, string> = {
  mainnet: "https://forno.celo.org",
  sepolia: "https://forno.celo-sepolia.celo-testnet.org",
};

export const KNOWN_TOKENS: Record<
  CeloNetwork,
  Record<string, { address: `0x${string}`; symbol: string; decimals: number }>
> = {
  mainnet: {
    CELO: {
      address: "0x471EcE3750Da237f93B8E339c536991b8978A438",
      symbol: "CELO",
      decimals: 18,
    },
    cUSD: {
      address: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
      symbol: "cUSD",
      decimals: 18,
    },
    cEUR: {
      address: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73",
      symbol: "cEUR",
      decimals: 18,
    },
    cREAL: {
      address: "0xE918F6463995C2d9915D9E2275BEaef0175610E4",
      symbol: "cREAL",
      decimals: 18,
    },
  },
  sepolia: {
    CELO: {
      address: "0xF194afDF50B03e77d7B785aA6925567E605C2D3e",
      symbol: "CELO",
      decimals: 18,
    },
    cUSD: {
      address: "0x4821310199c04d4C2eB4D0A2846e4D4215E1D8C",
      symbol: "cUSD",
      decimals: 18,
    },
  },
};

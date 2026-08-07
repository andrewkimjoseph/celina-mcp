import { tryParsePrivateKeyEnv } from "@andrewkimjoseph/celina-sdk";

export interface KeyConfigErrors {
  celo?: string;
  selfAgent?: string;
}

export interface AppConfig {
  rpcUrl: string;
  ethRpcUrl?: string;
  privateKey?: `0x${string}`;
  selfAgentPrivateKey?: `0x${string}`;
  keyErrors?: KeyConfigErrors;
}

function loadPrivateKey(
  raw: string | undefined,
  envName: "CELO_PRIVATE_KEY" | "SELF_AGENT_PRIVATE_KEY",
): { key?: `0x${string}`; error?: string } {
  const parsed = tryParsePrivateKeyEnv(raw, envName);
  return { key: parsed.value, error: parsed.error };
}

export function loadConfig(): AppConfig {
  const celo = loadPrivateKey(process.env.CELO_PRIVATE_KEY, "CELO_PRIVATE_KEY");
  const selfAgent = loadPrivateKey(
    process.env.SELF_AGENT_PRIVATE_KEY,
    "SELF_AGENT_PRIVATE_KEY",
  );

  const keyErrors: KeyConfigErrors = {};
  if (celo.error) keyErrors.celo = celo.error;
  if (selfAgent.error) keyErrors.selfAgent = selfAgent.error;

  return {
    rpcUrl: process.env.CELO_RPC_URL_MAINNET ?? "https://forno.celo.org",
    ethRpcUrl: process.env.ETH_RPC_URL_MAINNET,
    privateKey: celo.key,
    selfAgentPrivateKey: selfAgent.key,
    keyErrors: Object.keys(keyErrors).length > 0 ? keyErrors : undefined,
  };
}

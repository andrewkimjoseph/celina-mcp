import { describe, expect, it } from "vitest";
import { parsePrivateKeyEnv } from "@andrewkimjoseph/celina-sdk";
import { CeloClientFactory } from "../../src/clients/celo-client.js";
import type { AppConfig } from "../../src/config/env.js";

const CELO_KEY =
  "0xac0974bec39a17e36ba4a6b4d15588dd6936b93c12f6f356520cf899b8d4e178" as const;
const SELF_AGENT_KEY =
  "0x5de4111afa1a4b94908e83817c41f46e2e2ddd164f3358304a4c916ca8790649" as const;

function config(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    rpcUrl: "https://forno.celo.org",
    ...overrides,
  };
}

describe("CeloClientFactory", () => {
  it("defaults to self_agent when only SELF_AGENT_PRIVATE_KEY is set", () => {
    const factory = new CeloClientFactory(
      config({ selfAgentPrivateKey: SELF_AGENT_KEY }),
    );

    expect(factory.getDefaultSigner()).toBe("self_agent");
    expect(factory.getClients().accountAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("defaults to celo when both keys are configured", () => {
    const factory = new CeloClientFactory(
      config({ privateKey: CELO_KEY, selfAgentPrivateKey: SELF_AGENT_KEY }),
    );

    expect(factory.getDefaultSigner()).toBe("celo");
    expect(factory.getClients().accountAddress).toBe(
      factory.getClients("celo").accountAddress,
    );
  });

  it("throws when CELO_PRIVATE_KEY is an invalid placeholder", () => {
    const factory = new CeloClientFactory(
      config({
        privateKey: "0x..." as `0x${string}`,
        selfAgentPrivateKey: SELF_AGENT_KEY,
      }),
    );

    expect(() => factory.getClients("celo")).toThrow();
  });

  it("accepts Self agent key without 0x prefix", () => {
    const withPrefix = new CeloClientFactory(
      config({ selfAgentPrivateKey: SELF_AGENT_KEY }),
    );
    const withoutPrefix = new CeloClientFactory(
      config({
        selfAgentPrivateKey: parsePrivateKeyEnv(
          SELF_AGENT_KEY.slice(2),
          "SELF_AGENT_PRIVATE_KEY",
        ),
      }),
    );

    expect(withoutPrefix.getClients().accountAddress).toBe(
      withPrefix.getClients().accountAddress,
    );
  });

  it("throws when SELF_AGENT_PRIVATE_KEY is invalid", () => {
    const factory = new CeloClientFactory(
      config({ selfAgentPrivateKey: "0xdead" as `0x${string}` }),
    );

    expect(() => factory.getClients()).toThrow();
  });

  it("allows read-only mode with no keys configured", () => {
    const factory = new CeloClientFactory(config());

    expect(factory.getDefaultSigner()).toBeUndefined();
    expect(factory.getPublicClient()).toBeDefined();
    expect(() => factory.getClients()).toThrow(/No signing key configured/);
  });
});

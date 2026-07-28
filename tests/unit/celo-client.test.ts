import { generatePrivateKey } from "viem/accounts";
import { describe, expect, it } from "vitest";
import { CeloClientFactory } from "../../src/clients/celo-client.js";
import type { AppConfig } from "../../src/config/env.js";

const CELO_KEY = generatePrivateKey();
const SELF_KEY = generatePrivateKey();

function buildConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    rpcUrl: "https://forno.celo.org",
    ...overrides,
  };
}

describe("CeloClientFactory.hasSigner", () => {
  it("returns false for both signers when no keys are configured", () => {
    const factory = new CeloClientFactory(buildConfig());
    expect(factory.hasSigner("celo")).toBe(false);
    expect(factory.hasSigner("self_agent")).toBe(false);
  });

  it("returns true only for the configured signer", () => {
    const factory = new CeloClientFactory(
      buildConfig({ privateKey: CELO_KEY }),
    );
    expect(factory.hasSigner("celo")).toBe(true);
    expect(factory.hasSigner("self_agent")).toBe(false);
  });

  it("returns true for both signers when both keys are configured", () => {
    const factory = new CeloClientFactory(
      buildConfig({ privateKey: CELO_KEY, selfAgentPrivateKey: SELF_KEY }),
    );
    expect(factory.hasSigner("celo")).toBe(true);
    expect(factory.hasSigner("self_agent")).toBe(true);
  });

  it("does not throw for an unconfigured signer (unlike resolveSigner)", () => {
    const factory = new CeloClientFactory(buildConfig());
    expect(() => factory.hasSigner("self_agent")).not.toThrow();
    expect(() => factory.resolveSigner("self_agent")).toThrow(
      /SELF_AGENT_PRIVATE_KEY/,
    );
  });
});

describe("CeloClientFactory.getDefaultSigner", () => {
  it("prefers celo when both keys are configured", () => {
    const factory = new CeloClientFactory(
      buildConfig({ privateKey: CELO_KEY, selfAgentPrivateKey: SELF_KEY }),
    );
    expect(factory.getDefaultSigner()).toBe("celo");
  });

  it("falls back to self_agent when only that key is configured", () => {
    const factory = new CeloClientFactory(
      buildConfig({ selfAgentPrivateKey: SELF_KEY }),
    );
    expect(factory.getDefaultSigner()).toBe("self_agent");
  });

  it("is undefined when no keys are configured", () => {
    const factory = new CeloClientFactory(buildConfig());
    expect(factory.getDefaultSigner()).toBeUndefined();
  });
});

describe("CeloClientFactory.getClients", () => {
  it("resolves distinct addresses for celo and self_agent, and caches per signer", () => {
    const factory = new CeloClientFactory(
      buildConfig({ privateKey: CELO_KEY, selfAgentPrivateKey: SELF_KEY }),
    );

    const celoClients = factory.getClients("celo");
    const selfClients = factory.getClients("self_agent");

    expect(celoClients.accountAddress).toBeDefined();
    expect(selfClients.accountAddress).toBeDefined();
    expect(celoClients.accountAddress).not.toBe(selfClients.accountAddress);

    // Cached instance is returned on repeat calls for the same signer.
    expect(factory.getClients("celo")).toBe(celoClients);
  });

  it("throws when explicitly requesting an unconfigured signer", () => {
    const factory = new CeloClientFactory(
      buildConfig({ privateKey: CELO_KEY }),
    );
    expect(() => factory.getClients("self_agent")).toThrow(
      /SELF_AGENT_PRIVATE_KEY/,
    );
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config/env.js";

const KEY_WITH_PREFIX =
  "0xac0974bec39a17e36ba4a6b4d15588dd6936b93c12f6f356520cf899b8d4e178";
const KEY_WITHOUT_PREFIX =
  "ac0974bec39a17e36ba4a6b4d15588dd6936b93c12f6f356520cf899b8d4e178";

describe("loadConfig", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("normalizes CELO_PRIVATE_KEY without 0x prefix", () => {
    process.env = {
      ...env,
      CELO_PRIVATE_KEY: KEY_WITHOUT_PREFIX,
    };

    expect(loadConfig().privateKey).toBe(KEY_WITH_PREFIX);
  });

  it("rejects invalid CELO_PRIVATE_KEY at load time", () => {
    process.env = {
      ...env,
      CELO_PRIVATE_KEY: "0x...",
    };

    expect(() => loadConfig()).toThrow(/CELO_PRIVATE_KEY is set but invalid/);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { createServer } from "../../src/server/create-server.js";

describe("createServer", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("does not throw when CELO_PRIVATE_KEY is invalid", () => {
    process.env = {
      ...env,
      CELO_PRIVATE_KEY: "0x...",
    };

    expect(() =>
      createServer({
        serverKeyToolsEnabled: false,
        selfSessionToolsEnabled: false,
        estimateToolsEnabled: false,
        analyticsEnabled: false,
      }),
    ).not.toThrow();
  });
});

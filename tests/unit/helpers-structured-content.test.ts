import { describe, expect, it } from "vitest";
import { PreparedFlowExecutionError } from "@andrewkimjoseph/celina-sdk/simulation";
import { formatToolError, ok } from "../../src/tools/helpers.js";

describe("ok() structuredContent", () => {
  it("passes objects through unchanged", () => {
    const payload = { network: "mainnet", value: 1 };
    const result = ok(payload);
    expect(result.structuredContent).toEqual(payload);
  });

  it("wraps arrays in { result: data }", () => {
    const payload = [{ id: 1 }, { id: 2 }];
    const result = ok(payload);
    expect(result.structuredContent).toEqual({ result: payload });
  });

  it("wraps primitive values", () => {
    const result = ok("hello");
    expect(result.structuredContent).toEqual({ result: "hello" });
  });
});

describe("formatToolError", () => {
  it("returns a plain Error message unchanged", () => {
    expect(formatToolError(new Error("network timeout"))).toBe("network timeout");
  });

  it("appends confirmed hashes for a partial prepared flow", () => {
    const error = new PreparedFlowExecutionError(
      'Simulation failed for "Swap 1.27 CELO → USDT via Uniswap v4": execution reverted',
      ["0xabc"],
      2,
    );
    expect(formatToolError(error)).toBe(
      'Simulation failed for "Swap 1.27 CELO → USDT via Uniswap v4": execution reverted (1 of 2 steps already completed on-chain: 0xabc)',
    );
  });

  it("omits the hash suffix when no steps completed", () => {
    const error = new PreparedFlowExecutionError("simulation failed", [], 2);
    expect(formatToolError(error)).toBe("simulation failed");
  });
});

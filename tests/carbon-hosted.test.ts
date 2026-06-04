import { describe, expect, it } from "vitest";
import {
  ALL_TOOL_DEFINITIONS,
  filterToolDefinitions,
} from "@andrewkimjoseph/celina-sdk/tools";
import { resolveCarbonToolsOptions } from "../src/tools/carbon-options.js";

describe("resolveCarbonToolsOptions", () => {
  it("defaults to prepare and execute enabled", () => {
    expect(resolveCarbonToolsOptions({})).toEqual({
      prepareEnabled: true,
      executeEnabled: true,
    });
  });

  it("legacy writesEnabled false disables both", () => {
    expect(resolveCarbonToolsOptions({ writesEnabled: false })).toEqual({
      prepareEnabled: false,
      executeEnabled: false,
    });
  });

  it("hosted mode: execute off, prepare on", () => {
    expect(
      resolveCarbonToolsOptions({ executeEnabled: false, prepareEnabled: true }),
    ).toEqual({
      prepareEnabled: true,
      executeEnabled: false,
    });
  });

  it("execute false alone keeps prepare enabled", () => {
    expect(resolveCarbonToolsOptions({ executeEnabled: false })).toEqual({
      prepareEnabled: true,
      executeEnabled: false,
    });
  });
});

describe("Carbon hosted mode", () => {
  function carbonToolNames(
    options: ReturnType<typeof resolveCarbonToolsOptions>,
  ): string[] {
    return filterToolDefinitions(
      ALL_TOOL_DEFINITIONS.filter((d) => d.name.includes("carbon")),
      {
        surface: "mcp",
        carbonPrepareEnabled: options.prepareEnabled,
        carbonExecuteEnabled: options.executeEnabled,
      },
    ).map((d) => d.name);
  }

  it("hosted: 12 read + 13 prepare, no execute", () => {
    const names = carbonToolNames({
      prepareEnabled: true,
      executeEnabled: false,
    });

    expect(names.filter((n) => n.startsWith("prepare_carbon_"))).toHaveLength(
      13,
    );
    expect(names.filter((n) => n.startsWith("execute_carbon_"))).toHaveLength(
      0,
    );
    expect(names).toContain("get_carbon_strategies");
    expect(names).toContain("prepare_carbon_limit_order");
    expect(names.length).toBe(25);
  });

  it("legacy read-only: 12 read only", () => {
    const names = carbonToolNames({
      prepareEnabled: false,
      executeEnabled: false,
    });

    expect(names.some((n) => n.startsWith("prepare_carbon_"))).toBe(false);
    expect(names.some((n) => n.startsWith("execute_carbon_"))).toBe(false);
    expect(names).toContain("get_carbon_strategies");
    expect(names.length).toBe(12);
  });

  it("stdio: 12 read + 13 prepare + 13 execute", () => {
    const names = carbonToolNames({
      prepareEnabled: true,
      executeEnabled: true,
    });

    expect(names.filter((n) => n.startsWith("execute_carbon_"))).toHaveLength(
      13,
    );
    expect(names.filter((n) => n.startsWith("prepare_carbon_"))).toHaveLength(
      13,
    );
    expect(names.length).toBe(38);
  });
});

import { describe, expect, it } from "vitest";
import { createCarbonToolsModule } from "../src/tools/carbon.tools.js";

describe("Carbon hosted mode", () => {
  it("omits prepare_carbon_* when writesEnabled is false", () => {
    const names: string[] = [];
    const server = {
      registerTool: (name: string) => {
        names.push(name);
      },
    } as never;

    createCarbonToolsModule({ writesEnabled: false }).register(
      server,
      {} as never,
    );

    expect(names.some((n) => n.startsWith("prepare_carbon_"))).toBe(false);
    expect(names).toContain("get_carbon_strategies");
    expect(names).toContain("simulate_carbon_strategy");
    expect(names.length).toBe(12);
  });
});

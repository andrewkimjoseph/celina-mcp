import { describe, expect, it } from "vitest";
import { getMcpToolNames } from "@cnvlabskoxyz/celina-sdk/tools";
import { MCP_TOOL_NAMES } from "@cnvlabskoxyz/celina-sdk/testing";
import { getMcpClient } from "./helpers/run-mcp-operation.js";

describe("registry parity", () => {
  it("SDK catalog MCP tool names match operation catalog", () => {
    const fromSdk = getMcpToolNames().sort();
    const catalog = [...MCP_TOOL_NAMES].sort();

    expect(fromSdk).toEqual(catalog);
  });

  it("tools/list matches SDK MCP tool catalog", async () => {
    const client = await getMcpClient();
    const listed = (await client.listTools()).sort();
    const expected = getMcpToolNames().sort();

    expect(listed).toEqual(expected);
  });
});

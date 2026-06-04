import { describe, expect, it } from "vitest";
import { getMcpToolNames } from "@andrewkimjoseph/celina-sdk/tools";
import { MCP_TOOL_NAMES } from "@andrewkimjoseph/celina-sdk/testing";
import { getMcpClient } from "./helpers/run-mcp-operation.js";

describe("registry parity", () => {
  it("SDK catalog MCP tool names match operation catalog", () => {
    const fromSdk = getMcpToolNames({
      carbonPrepareEnabled: true,
      carbonExecuteEnabled: true,
    }).sort();
    const catalog = [...MCP_TOOL_NAMES].sort();

    expect(fromSdk).toEqual(catalog);
  });

  it("tools/list matches SDK MCP tool catalog", async () => {
    const client = await getMcpClient();
    const listed = (await client.listTools()).sort();
    const expected = getMcpToolNames({
      carbonPrepareEnabled: true,
      carbonExecuteEnabled: true,
    }).sort();

    expect(listed).toEqual(expected);
  });
});

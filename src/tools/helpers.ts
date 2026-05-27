import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export function ok(data: unknown): CallToolResult {
  const text = JSON.stringify(data, null, 2);
  const structuredContent =
    typeof data === "object" && data !== null && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : { result: data };

  return {
    content: [{ type: "text", text }],
    structuredContent,
  };
}

export function err(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface McpToolCallResult {
  isError?: boolean;
  content: Array<{ type: string; text?: string }>;
  structuredContent?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id?: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export class McpStdioClient {
  private readonly proc: ChildProcessWithoutNullStreams;
  private nextId = 1;
  private buffer = "";
  private readonly pending = new Map<
    number,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
    }
  >();

  constructor(serverEntry: string) {
    this.proc = spawn(process.execPath, [serverEntry], {
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.proc.stdout.setEncoding("utf8");
    this.proc.stdout.on("data", (chunk: string) => {
      this.buffer += chunk;
      this.flushBuffer();
    });

    this.proc.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      if (text.trim()) {
        process.stderr.write(`[mcp stderr] ${text}`);
      }
    });

    this.proc.on("exit", (code) => {
      const error = new Error(`MCP server exited with code ${code ?? "unknown"}`);
      for (const { reject } of this.pending.values()) {
        reject(error);
      }
      this.pending.clear();
    });
  }

  static defaultServerPath(): string {
    const here = path.dirname(fileURLToPath(import.meta.url));
    return path.resolve(here, "../../build/index.js");
  }

  private flushBuffer(): void {
    while (true) {
      const newlineIndex = this.buffer.indexOf("\n");
      if (newlineIndex === -1) {
        return;
      }

      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (!line) {
        continue;
      }

      let message: JsonRpcResponse;
      try {
        message = JSON.parse(line) as JsonRpcResponse;
      } catch {
        continue;
      }

      if (message.id === undefined) {
        continue;
      }

      const pending = this.pending.get(message.id);
      if (!pending) {
        continue;
      }

      this.pending.delete(message.id);

      if (message.error) {
        pending.reject(new Error(message.error.message));
      } else {
        pending.resolve(message.result);
      }
    }
  }

  private send(method: string, params?: unknown): Promise<unknown> {
    const id = this.nextId++;
    const payload = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.proc.stdin.write(`${JSON.stringify(payload)}\n`);
    });
  }

  private notify(method: string, params?: unknown): void {
    const payload = {
      jsonrpc: "2.0",
      method,
      params,
    };
    this.proc.stdin.write(`${JSON.stringify(payload)}\n`);
  }

  async initialize(): Promise<void> {
    await this.send("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "celina-test", version: "1.0.0" },
    });
    this.notify("notifications/initialized", {});
  }

  async listTools(): Promise<string[]> {
    const result = (await this.send("tools/list", {})) as {
      tools: Array<{ name: string }>;
    };
    return result.tools.map((tool) => tool.name);
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<McpToolCallResult> {
    const result = (await this.send("tools/call", {
      name,
      arguments: args,
    })) as McpToolCallResult;
    return result;
  }

  close(): void {
    this.proc.stdin.end();
    this.proc.kill();
  }
}

export function parseToolResultBody(result: McpToolCallResult): unknown {
  if (result.structuredContent) {
    return unwrapMcpPayload(result.structuredContent);
  }

  const text = result.content?.[0]?.text;
  if (!text) {
    return undefined;
  }

  try {
    return unwrapMcpPayload(JSON.parse(text) as unknown);
  } catch {
    return text;
  }
}

/** Unwrap `{ result: data }` envelopes from MCP `ok()` for arrays/primitives. */
export function unwrapMcpPayload(body: unknown): unknown {
  if (
    typeof body === "object" &&
    body !== null &&
    !Array.isArray(body) &&
    "result" in body &&
    Object.keys(body as object).length === 1
  ) {
    return (body as { result: unknown }).result;
  }
  return body;
}

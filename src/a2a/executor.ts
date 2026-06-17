import type { Message } from "@a2a-js/sdk";
import type {
  AgentExecutor,
  ExecutionEventBus,
  RequestContext,
} from "@a2a-js/sdk/server";
import {
  ALL_TOOL_DEFINITIONS,
  getHostedMcpToolNames,
  type ToolDefinition,
  type ToolRuntime,
} from "@andrewkimjoseph/celina-sdk/tools";
import { CELINA_TOOL_MIME } from "@andrewkimjoseph/celina-sdk/a2a";

export interface CelinaToolInvocation {
  tool: string;
  arguments: Record<string, unknown>;
}

const HOSTED_TOOL_SET = new Set(getHostedMcpToolNames());

const TOOL_BY_NAME = new Map(
  ALL_TOOL_DEFINITIONS.map((definition) => [definition.name, definition]),
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseCelinaToolInvocation(message: Message): CelinaToolInvocation {
  for (const part of message.parts) {
    if (part.kind === "data" && isRecord(part.data)) {
      const tool = part.data.tool;
      if (typeof tool === "string" && tool.length > 0) {
        const args = part.data.arguments;
        return {
          tool,
          arguments: isRecord(args) ? args : {},
        };
      }
    }
  }

  for (const part of message.parts) {
    if (part.kind === "text") {
      try {
        const parsed = JSON.parse(part.text) as unknown;
        if (isRecord(parsed) && typeof parsed.tool === "string") {
          const args = parsed.arguments;
          return {
            tool: parsed.tool,
            arguments: isRecord(args) ? args : {},
          };
        }
      } catch {
        // not JSON — try next part
      }
    }
  }

  throw new Error(
    `Expected a message part with ${CELINA_TOOL_MIME} payload: {"tool":"<hosted_tool>","arguments":{...}}`,
  );
}

async function runHostedTool(
  runtime: ToolRuntime,
  invocation: CelinaToolInvocation,
): Promise<unknown> {
  if (!HOSTED_TOOL_SET.has(invocation.tool)) {
    throw new Error(
      `Tool "${invocation.tool}" is not available on hosted A2A (read-only profile).`,
    );
  }

  const definition: ToolDefinition | undefined = TOOL_BY_NAME.get(invocation.tool);
  if (!definition) {
    throw new Error(`Unknown tool "${invocation.tool}".`);
  }

  return definition.handler(runtime, invocation.arguments);
}

export class CelinaA2AExecutor implements AgentExecutor {
  constructor(private readonly runtime: ToolRuntime) {}

  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus,
  ): Promise<void> {
    const messageId = crypto.randomUUID();

    try {
      const invocation = parseCelinaToolInvocation(requestContext.userMessage);
      const result = await runHostedTool(this.runtime, invocation);

      eventBus.publish({
        kind: "message",
        messageId,
        role: "agent",
        contextId: requestContext.contextId,
        parts: [
          {
            kind: "data",
            data: {
              tool: invocation.tool,
              result,
            },
            metadata: {
              mimeType: "application/json",
            },
          },
        ],
      });
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Celina tool execution failed.";
      eventBus.publish({
        kind: "message",
        messageId,
        role: "agent",
        contextId: requestContext.contextId,
        parts: [{ kind: "text", text }],
      });
    } finally {
      eventBus.finished();
    }
  }

  cancelTask = async (): Promise<void> => {};
}

import { HTTP_EXTENSION_HEADER } from "@a2a-js/sdk";
import {
  JsonRpcTransportHandler,
  ServerCallContext,
  UnauthenticatedUser,
} from "@a2a-js/sdk/server";
import type { CreateA2ARequestHandlerOptions } from "./create-handler.js";
import {
  createHostedA2AAgentCard,
  getA2ARequestHandler,
} from "./create-handler.js";

function a2aContext(): ServerCallContext {
  return new ServerCallContext([], new UnauthenticatedUser());
}

export async function handleA2ARequest(
  request: Request,
  options: CreateA2ARequestHandlerOptions = {},
): Promise<Response> {
  if (request.method === "GET" || request.method === "HEAD") {
    const card = createHostedA2AAgentCard(options);
    if (request.method === "HEAD") {
      return new Response(null, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return Response.json(card);
  }

  if (request.method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
      { status: 400 },
    );
  }

  const handler = getA2ARequestHandler(options);
  const transport = new JsonRpcTransportHandler(handler);
  const context = a2aContext();
  const rpcResponse = await transport.handle(body, context);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (context.activatedExtensions) {
    headers[HTTP_EXTENSION_HEADER] = Array.from(context.activatedExtensions).join(
      ", ",
    );
  }

  return Response.json(rpcResponse, { status: 200, headers });
}

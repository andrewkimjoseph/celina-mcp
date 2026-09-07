import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  formatSelfSessionLinksDisplay,
  resolveSelfSessionLinks,
  type SelfSessionLinks,
} from "@andrewkimjoseph/celina-sdk";
import { isPreparedFlowExecutionError } from "@andrewkimjoseph/celina-sdk/simulation";

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

/** Format a thrown tool error, including confirmed hashes from a partial flow. */
export function formatToolError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (!isPreparedFlowExecutionError(error) || error.stepHashes.length === 0) {
    return message;
  }

  const hashes = error.stepHashes.join(", ");
  const ofTotal =
    error.stepCount != null
      ? `${error.stepHashes.length} of ${error.stepCount}`
      : String(error.stepHashes.length);
  return `${message} (${ofTotal} steps already completed on-chain: ${hashes})`;
}

function selfSessionLinksFromPayload(
  data: Record<string, unknown>,
): SelfSessionLinks {
  const qrCodeUrl = data.qr_code_url ?? data.qr_url;
  const deepLink = data.deep_link;

  if (
    typeof qrCodeUrl === "string" &&
    qrCodeUrl &&
    typeof deepLink === "string" &&
    deepLink
  ) {
    return { qr_code_url: qrCodeUrl, deep_link: deepLink };
  }

  if (
    typeof data.session_id === "string" &&
    typeof deepLink === "string" &&
    deepLink
  ) {
    return resolveSelfSessionLinks({
      sessionToken: data.session_id,
      deepLink,
      scanUrl: typeof qrCodeUrl === "string" ? qrCodeUrl : undefined,
    });
  }

  throw new Error("Self session response is missing qr_code_url and deep_link.");
}

/** MCP response for Self QR/deep-link sessions — surfaces both links in tool text. */
export function okSelfSession(data: Record<string, unknown>): CallToolResult {
  const links = selfSessionLinksFromPayload(data);
  const payload = {
    ...data,
    qr_code_url: links.qr_code_url,
    qr_url: links.qr_code_url,
    deep_link: links.deep_link,
  };

  const displayText = [
    formatSelfSessionLinksDisplay(links),
    "",
    JSON.stringify(payload, null, 2),
  ].join("\n");

  return {
    content: [{ type: "text", text: displayText }],
    structuredContent: payload,
  };
}

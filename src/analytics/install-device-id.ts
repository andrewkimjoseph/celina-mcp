import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** Sanitized npm name for @andrewkimjoseph/celina-mcp (matches celina-sdk telemetry). */
export const MCP_PACKAGE_DEVICE_ID = "andrewkimjoseph_celina_mcp";

function installIdFilePath(): string {
  return join(homedir(), ".config", "celina", "install-id");
}

function installIdSuffixFromUuid(uuid: string): string {
  return uuid.replace(/-/g, "").slice(0, 8).toLowerCase();
}

/** Stable anonymous id persisted under ~/.config/celina/install-id. */
export function getOrCreateInstallId(): string {
  const installIdFile = installIdFilePath();
  try {
    if (existsSync(installIdFile)) {
      const existing = readFileSync(installIdFile, "utf8").trim();
      if (existing.length >= 8) {
        return installIdSuffixFromUuid(existing);
      }
    }
    const uuid = randomUUID();
    mkdirSync(join(homedir(), ".config", "celina"), { recursive: true });
    writeFileSync(installIdFile, `${uuid}\n`, "utf8");
    return installIdSuffixFromUuid(uuid);
  } catch {
    return "";
  }
}

/**
 * Amplitude device_id for this MCP install.
 * Package id + per-install suffix from ~/.config/celina/install-id.
 */
export function getMcpAnalyticsDeviceId(): string {
  const suffix = getOrCreateInstallId();
  if (!suffix) {
    return MCP_PACKAGE_DEVICE_ID;
  }
  return `${MCP_PACKAGE_DEVICE_ID}_${suffix}`;
}

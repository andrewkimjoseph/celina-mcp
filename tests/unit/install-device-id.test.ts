import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("install-device-id", () => {
  let tempHome: string;
  let originalHome: string | undefined;

  beforeEach(() => {
    originalHome = process.env.HOME;
    tempHome = mkdtempSync(join(tmpdir(), "celina-mcp-home-"));
    process.env.HOME = tempHome;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    if (originalHome === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = originalHome;
    }
    rmSync(tempHome, { recursive: true, force: true });
  });

  it("creates a stable install id file and reuses the suffix", async () => {
    vi.resetModules();
    const mod = await import("../../src/analytics/install-device-id.js");
    const first = mod.getOrCreateInstallId();
    const second = mod.getOrCreateInstallId();
    expect(first).toMatch(/^[a-f0-9]{8}$/);
    expect(second).toBe(first);
  });

  it("builds device id as package prefix plus install suffix", async () => {
    vi.resetModules();
    const mod = await import("../../src/analytics/install-device-id.js");
    const deviceId = mod.getMcpAnalyticsDeviceId();
    expect(deviceId).toMatch(/^andrewkimjoseph_celina_mcp_[a-f0-9]{8}$/);
  });

  it("uses CELINA_ANALYTICS_DEVICE_ID when set", async () => {
    vi.stubEnv("CELINA_ANALYTICS_DEVICE_ID", "custom_install");
    vi.resetModules();
    const mod = await import("../../src/analytics/install-device-id.js");
    expect(mod.getMcpAnalyticsDeviceId()).toBe("custom_install");
  });
});

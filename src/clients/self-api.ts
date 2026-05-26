import {
  SELF_API_BASE,
  SELF_API_NETWORK,
  SELF_CHAIN_ID,
  type SelfRegistrationMode,
} from "../config/self.js";

const DEFAULT_POLL_INTERVAL_MS = 5000;
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

export class SelfApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SelfApiError";
  }
}

export class SelfExpiredSessionError extends Error {
  constructor(message = "Session expired. Start a new registration flow.") {
    super(message);
    this.name = "SelfExpiredSessionError";
  }
}

export interface SelfRegistrationDisclosures {
  minimumAge?: number;
  ofac?: boolean;
}

export interface SelfRegistrationResult {
  agentId: number;
  agentAddress: string;
  credentials?: unknown;
  txHash?: string;
}

export interface SelfRefreshResult {
  proofExpiresAt: Date;
}

export interface SelfRegistrationSession {
  sessionToken: string;
  stage: string;
  deepLink: string;
  scanUrl?: string;
  agentAddress: string;
  expiresAt: string;
  timeRemainingMs?: number;
  humanInstructions: string[];
  waitForCompletion(opts?: {
    timeoutMs?: number;
    pollIntervalMs?: number;
  }): Promise<SelfRegistrationResult>;
  exportKey(): Promise<string>;
}

export interface SelfRefreshSession {
  sessionToken: string;
  stage: string;
  deepLink: string;
  scanUrl?: string;
  expiresAt: string;
  timeRemainingMs?: number;
  humanInstructions: string[];
  waitForCompletion(opts?: {
    timeoutMs?: number;
    pollIntervalMs?: number;
  }): Promise<SelfRefreshResult>;
}

export interface SelfDeregistrationSession {
  sessionToken: string;
  stage: string;
  deepLink: string;
  scanUrl?: string;
  expiresAt: string;
  timeRemainingMs?: number;
  humanInstructions: string[];
  waitForCompletion(opts?: {
    timeoutMs?: number;
    pollIntervalMs?: number;
  }): Promise<void>;
}

function resolveApiBase(apiBase?: string): string {
  return (apiBase ?? process.env.SELF_AGENT_API_BASE ?? SELF_API_BASE).replace(
    /\/+$/,
    "",
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    const errorMsg =
      typeof body.error === "string" ? body.error : `HTTP ${res.status}`;
    throw new SelfApiError(errorMsg);
  }

  return body as T;
}

function sessionAuthHeaders(sessionToken: string): HeadersInit {
  return { Authorization: `Bearer ${sessionToken}` };
}

async function fetchSessionStatus(
  apiBase: string,
  path: string,
  sessionToken: string,
): Promise<Record<string, unknown>> {
  return apiFetch(
    `${apiBase}${path}?token=${encodeURIComponent(sessionToken)}`,
    { headers: sessionAuthHeaders(sessionToken) },
  );
}

function handleSessionStatusError(
  error: unknown,
  expiredMessage: string,
): never {
  if (
    error instanceof SelfApiError &&
    error.message.toLowerCase().includes("expired")
  ) {
    throw new SelfExpiredSessionError(expiredMessage);
  }
  throw error;
}

function optionalScanUrl(data: Record<string, unknown>): string | undefined {
  return typeof data.scanUrl === "string" ? data.scanUrl : undefined;
}

function buildRegistrationSession(
  data: Record<string, unknown>,
  apiBase: string,
): SelfRegistrationSession {
  let currentToken = String(data.sessionToken);

  return {
    sessionToken: currentToken,
    stage: String(data.stage),
    deepLink: String(data.deepLink),
    scanUrl: optionalScanUrl(data),
    agentAddress: String(data.agentAddress),
    expiresAt: String(data.expiresAt),
    timeRemainingMs:
      typeof data.timeRemainingMs === "number" ? data.timeRemainingMs : undefined,
    humanInstructions: Array.isArray(data.humanInstructions)
      ? data.humanInstructions.map(String)
      : [],
    async waitForCompletion(opts) {
      const timeout = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const interval = opts?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
      const deadline = Date.now() + timeout;

      while (Date.now() < deadline) {
        await sleep(interval);

        let status: Record<string, unknown>;
        try {
          status = await fetchSessionStatus(
            apiBase,
            "/api/agent/register/status",
            currentToken,
          );
        } catch (error) {
          handleSessionStatusError(error, "Session expired. Start a new registration flow.");
        }

        currentToken = String(status.sessionToken);

        if (status.stage === "completed") {
          return {
            agentId: Number(status.agentId),
            agentAddress: String(status.agentAddress ?? data.agentAddress),
            credentials: status.credentials,
            txHash:
              typeof status.txHash === "string" ? status.txHash : undefined,
          };
        }

        if (status.stage === "failed") {
          throw new SelfApiError("Registration failed on-chain.");
        }

        if (status.stage === "expired") {
          throw new SelfExpiredSessionError();
        }
      }

      throw new SelfApiError(
        `Registration did not complete within ${timeout}ms. Call check_self_registration again to resume polling.`,
      );
    },
    async exportKey() {
      const result = await apiFetch<{ privateKey: string }>(
        `${apiBase}/api/agent/register/export`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...sessionAuthHeaders(currentToken),
          },
          body: JSON.stringify({ token: currentToken }),
        },
      );
      return result.privateKey;
    },
  };
}

function buildRefreshSession(
  data: Record<string, unknown>,
  apiBase: string,
): SelfRefreshSession {
  let currentToken = String(data.sessionToken);

  return {
    sessionToken: currentToken,
    stage: String(data.stage),
    deepLink: String(data.deepLink),
    scanUrl: optionalScanUrl(data),
    expiresAt: String(data.expiresAt),
    timeRemainingMs:
      typeof data.timeRemainingMs === "number" ? data.timeRemainingMs : undefined,
    humanInstructions: Array.isArray(data.humanInstructions)
      ? data.humanInstructions.map(String)
      : [],
    async waitForCompletion(opts) {
      const timeout = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const interval = opts?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
      const deadline = Date.now() + timeout;

      while (Date.now() < deadline) {
        await sleep(interval);

        let status: Record<string, unknown>;
        try {
          status = await fetchSessionStatus(
            apiBase,
            "/api/agent/refresh/status",
            currentToken,
          );
        } catch (error) {
          handleSessionStatusError(
            error,
            "Proof refresh session expired. Call refresh_self_proof to start a new session.",
          );
        }

        currentToken = String(status.sessionToken);

        if (status.stage === "completed") {
          const expiresAtRaw = status.proofExpiresAt;
          const proofExpiresAt =
            typeof expiresAtRaw === "string" || typeof expiresAtRaw === "number"
              ? new Date(expiresAtRaw)
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          return { proofExpiresAt };
        }

        if (status.stage === "failed") {
          throw new SelfApiError("Proof refresh failed on-chain.");
        }

        if (status.stage === "expired") {
          throw new SelfExpiredSessionError(
            "Proof refresh session expired. Call refresh_self_proof to start a new session.",
          );
        }
      }

      throw new SelfApiError(
        `Proof refresh did not complete within ${timeout}ms. Call check_self_registration again to resume polling.`,
      );
    },
  };
}

function buildDeregistrationSession(
  data: Record<string, unknown>,
  apiBase: string,
): SelfDeregistrationSession {
  let currentToken = String(data.sessionToken);

  return {
    sessionToken: currentToken,
    stage: String(data.stage),
    deepLink: String(data.deepLink),
    scanUrl: optionalScanUrl(data),
    expiresAt: String(data.expiresAt),
    timeRemainingMs:
      typeof data.timeRemainingMs === "number" ? data.timeRemainingMs : undefined,
    humanInstructions: Array.isArray(data.humanInstructions)
      ? data.humanInstructions.map(String)
      : [],
    async waitForCompletion(opts) {
      const timeout = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const interval = opts?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
      const deadline = Date.now() + timeout;

      while (Date.now() < deadline) {
        await sleep(interval);

        let status: Record<string, unknown>;
        try {
          status = await fetchSessionStatus(
            apiBase,
            "/api/agent/deregister/status",
            currentToken,
          );
        } catch (error) {
          handleSessionStatusError(
            error,
            "Deregistration session expired. Call deregister_self_agent to start a new session.",
          );
        }

        currentToken = String(status.sessionToken);

        if (status.stage === "completed") {
          return;
        }

        if (status.stage === "failed") {
          throw new SelfApiError("Deregistration failed on-chain.");
        }

        if (status.stage === "expired") {
          throw new SelfExpiredSessionError(
            "Deregistration session expired. Call deregister_self_agent to start a new session.",
          );
        }
      }

      throw new SelfApiError(
        `Deregistration did not complete within ${timeout}ms. Call check_self_registration again to resume polling.`,
      );
    },
  };
}

export async function requestRegistration(opts: {
  mode?: SelfRegistrationMode;
  disclosures?: SelfRegistrationDisclosures;
  humanAddress?: string;
  agentName?: string;
  agentDescription?: string;
  apiBase?: string;
}) {
  const base = resolveApiBase(opts.apiBase);
  const payload = {
    mode: opts.mode ?? "wallet-free",
    network: SELF_API_NETWORK,
    disclosures: opts.disclosures,
    humanAddress: opts.humanAddress,
    agentName: opts.agentName,
    agentDescription: opts.agentDescription,
  };

  const data = await apiFetch<Record<string, unknown>>(
    `${base}/api/agent/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  return buildRegistrationSession(data, base);
}

export async function requestDeregistration(opts: {
  agentAddress: string;
  disclosures?: SelfRegistrationDisclosures;
  apiBase?: string;
}) {
  const base = resolveApiBase(opts.apiBase);
  const data = await apiFetch<Record<string, unknown>>(
    `${base}/api/agent/deregister`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        network: SELF_API_NETWORK,
        agentAddress: opts.agentAddress,
        disclosures: opts.disclosures,
      }),
    },
  );

  return buildDeregistrationSession(data, base);
}

export async function requestProofRefresh(opts: {
  agentId: number;
  disclosures?: SelfRegistrationDisclosures;
  apiBase?: string;
}) {
  const base = resolveApiBase(opts.apiBase);
  const data = await apiFetch<Record<string, unknown>>(
    `${base}/api/agent/refresh`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: opts.agentId,
        network: SELF_API_NETWORK,
        disclosures: opts.disclosures,
      }),
    },
  );

  return buildRefreshSession(data, base);
}

export async function getAgentInfo(agentId: number, apiBase?: string) {
  const base = resolveApiBase(apiBase);
  return apiFetch<Record<string, unknown>>(
    `${base}/api/agent/info/${SELF_CHAIN_ID}/${agentId}`,
  );
}

export async function getAgentsForHuman(
  address: string,
  apiBase?: string,
): Promise<Record<string, unknown>> {
  const base = resolveApiBase(apiBase);
  return apiFetch(`${base}/api/agent/agents/${SELF_CHAIN_ID}/${address}`);
}

export function selfQrUrl(sessionToken: string, apiBase?: string): string {
  return `${resolveApiBase(apiBase)}/scan/${sessionToken}`;
}

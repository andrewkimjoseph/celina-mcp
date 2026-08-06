<p align="center">
  <img src="https://raw.githubusercontent.com/andrewkimjoseph/celina-mcp/main/assets/celina-banner.png" alt="Celina — Give your LLM a wallet on Celo">
</p>

<h1 align="center">Celina — Celo MCP Server</h1>

<p align="center">
  <strong>Celina</strong> is an open-source <a href="https://modelcontextprotocol.io">Model Context Protocol</a> server for <strong>Celo mainnet</strong>. It registers the shared <a href="https://www.npmjs.com/package/@andrewkimjoseph/celina-sdk"><code>@andrewkimjoseph/celina-sdk/tools</code></a> catalog — the same Zod schemas and handlers that power browser wallet apps — so MCP and agent hosts stay in sync without duplicate tool definitions.
</p>

<p align="center">
  <a href="https://celina.andrewkimjoseph.com">Website</a>
  ·
  <a href="https://www.npmjs.com/package/@andrewkimjoseph/celina-mcp">npm</a>
  ·
  <a href="https://mcp.usecelina.xyz/api/mcp">Hosted (reads + prepare)</a>
</p>

## Install

```bash
npm i @andrewkimjoseph/celina-mcp@latest
```

## Migration

If you still use `@andrewkimjoseph/celina`, update your MCP config `args` to `@andrewkimjoseph/celina-mcp` and rename the server key to `celina-mcp`. The old package name remains published as a wrapper through one release cycle.

## Quick start

**Recommended:** install locally and connect over stdio — full tool catalog with execute/write when you set `CELO_PRIVATE_KEY`, no cold starts, and keys stay on your machine.

Your MCP client (Cursor, Claude Desktop, LM Studio, etc.) spawns Celina as a child process via `npx`. Tools register from `@andrewkimjoseph/celina-sdk/tools` via `registerSdkTools`. See [Local stdio (recommended)](#local-stdio-recommended).

For chain reads without a local install, use the hosted Streamable HTTP endpoint at [https://mcp.usecelina.xyz/api/mcp](https://mcp.usecelina.xyz/api/mcp) — see [Hosted (reads + prepare)](#hosted-reads--prepare).

## MCP setup

Pick your client, install the package, paste the config, restart. Celina shows up as MCP tools your LLM can call.

### Local stdio (recommended)

Install the package, then add Celina to your MCP config. Your client spawns `npx` and talks to Celina over stdio. Works in any stdio client (Cursor, Claude Desktop, LM Studio, Continue, MCP Inspector). Requires Node.js ≥ 20.

1. Run `npm i @andrewkimjoseph/celina-mcp` (optional but recommended — caches the package locally for faster MCP startup)
2. Open your MCP config (e.g. `claude_desktop_config.json`, Cursor **Settings → MCP**) and merge the snippet below into `mcpServers`
3. Restart the client

```json
{
  "mcpServers": {
    "celina-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@andrewkimjoseph/celina-mcp"],
      "env": {
        "CELO_PRIVATE_KEY": "0x...",
        "SELF_AGENT_PRIVATE_KEY": "0x..."
      }
    }
  }
}
```

Keep `CELO_PRIVATE_KEY` and `SELF_AGENT_PRIVATE_KEY` out of source control — they stay on your machine. Omit both for read-only chain queries.

Private keys accept **64 hex characters with or without a `0x` prefix** (normalized at startup). Do not leave placeholder values like `0x...` in config — they fail validation and block MCP startup. **Self-only** setups can use **`SELF_AGENT_PRIVATE_KEY` alone** (omit `CELO_PRIVATE_KEY`) for governance/staking when the Self agent passes humanness.

**Read telemetry:** Off-chain tool usage is logged via the bundled Celina SDK. Each MCP install gets a stable `device_id` (`~/.config/celina/install-id`) so stats can distinguish hosts; wallet-scoped reads also set Amplitude `user_id` to the public wallet address (from tool args or the `CELO_PRIVATE_KEY` signer). Opt out or override via `createServer({ analyticsEnabled: false, analyticsDeviceId: "..." })` when embedding the server programmatically.

### Claude Desktop

Use the same stdio config in `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`). Requires Node.js ≥ 20.

```json
{
  "mcpServers": {
    "celina-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@andrewkimjoseph/celina-mcp"],
      "env": {
        "CELO_PRIVATE_KEY": "0x...",
        "SELF_AGENT_PRIVATE_KEY": "0x..."
      }
    }
  }
}
```

Fully quit and relaunch Claude Desktop after editing the config (closing the window is not enough).

### Local stdio (from source)

For development from a cloned repo, point at your local `build/index.js`:

```json
{
  "mcpServers": {
    "celina-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/celina-mcp/build/index.js"],
      "env": {
        "CELO_PRIVATE_KEY": "0x...",
        "SELF_AGENT_PRIVATE_KEY": "0x..."
      }
    }
  }
}
```

## Run Celina with your own model

Celina is a plain MCP server. Pair it with any MCP-aware local stack — Ollama, LM Studio, llama.cpp — through a client that supports tool calling.

Read-only tools (balances, blocks, GoodDollar status, etc.) work out of the box. For write tools, set `CELO_PRIVATE_KEY` in the MCP server `env` block. Stdio writes simulate each prepared step before broadcast to catch reverts before gas is spent.

### LM Studio (0.3.17+)

Native MCP hosting via `mcp.json`.

1. **Program** → **Install** → **Edit mcp.json**
2. Add Celina under `mcpServers`
3. Enable **Allow calling servers from mcp.json**
4. Chat with a tool-capable model (Qwen 2.5, Llama 3.1+)

```json
{
  "mcpServers": {
    "celina-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@andrewkimjoseph/celina-mcp"],
      "env": {
        "CELO_PRIVATE_KEY": "0x...",
        "SELF_AGENT_PRIVATE_KEY": "0x..."
      }
    }
  }
}
```

Omit `CELO_PRIVATE_KEY` for read-only.

### Continue · VS Code

Agent mode in your editor. Drop a YAML file into your workspace and Continue picks it up in agent mode.

1. Create `.continue/mcpServers/celina-mcp.yaml`
2. Paste the snippet below
3. Switch Continue to agent mode and prompt

```yaml
name: Celina
version: 0.0.1
schema: v1
mcpServers:
  - name: celina-mcp
    type: stdio
    command: npx
    args:
      - "-y"
      - "@andrewkimjoseph/celina-mcp"
```

Alternatively, copy the [local stdio JSON](#local-stdio-recommended) into `.continue/mcpServers/mcp.json` — Continue picks up Claude/Cursor-style configs automatically.

### Test without an LLM

Use MCP Inspector to call Celina tools directly over stdio:

```bash
npm run build
npm run inspect
```

### Tips

- Use models with reliable tool-calling support; small or older models may skip tools or call them incorrectly.
- Start with read-only prompts, e.g. *"What's the USDm balance of 0x…?"*, *"Is this wallet GoodDollar whitelisted?"*, or *"Can this address claim GoodDollar UBI today?"*
- Keep private keys in env vars only — never commit them to config files in git.

## Hosted (reads + prepare)

A public hosted endpoint is available at **https://mcp.usecelina.xyz/api/mcp** (alias: `/mcp`). Use this when you need chain reads without a local `npx` install.

**Local stdio remains the recommended setup** — it supports write tools with your own keys, Self Agent ID flows, and avoids serverless cold starts.

**Client config (hosted, no local install):**

```json
{
  "mcpServers": {
    "celina-mcp": {
      "url": "https://mcp.usecelina.xyz/api/mcp"
    }
  }
}
```

The hosted service runs on Vercel via [celina-mcp-host](../celina-mcp-host/). Do **not** send private keys to the hosted endpoint — writes are disabled server-side.

**Works without keys:** all hosted `get_*` reads — including `check_humanness`, governance reads (`get_governance_proposals`, `get_locked_celo_balance`, `get_pending_withdrawals`, `get_votable_proposals`, `get_governance_votes`), staking reads (`get_stake_eligibility`, `get_delegation_info`, `get_governance_delegates`), `get_celo_account_registration`, `get_gooddollar_identity_link`, Aave/GoodDollar quotes, Self verify/lookup, AgentKarma, NFT/contract reads, etc.

**Hosted MCP:** **45 tools** — reads, oracle/AMM quotes, attribution check/verify, humanness check, governance/staking reads, and AgentKarma reputation (read-only external API; explicit `address` required — no signer fallback). **`estimate_*`**, server-key writes (`send_token`, `execute_lock_celo`, `execute_stake`, `execute_gooddollar_reserve_swap`, etc.), `get_wallet_address`, GoodDollar connect/disconnect/claim writes, and Self lifecycle/registration tools require **local stdio** with `CELO_PRIVATE_KEY` / `SELF_AGENT_PRIVATE_KEY`.

**Unreliable on serverless:** `register_self_agent` / `check_self_registration` — Self sessions are in-memory and do not persist across stateless function invocations.

See [celina-mcp-host/README.md](../celina-mcp-host/README.md) if you want to deploy your own instance.

## Write tools

Set `CELO_PRIVATE_KEY` and/or `SELF_AGENT_PRIVATE_KEY` in your MCP server `env` block for on-chain writes. Pass optional `signer: "celo" | "self_agent"` when both keys are configured. Stdio writes include: `send_token`, DeFi executes (`execute_mento_fx`, `execute_uniswap_swap`, `execute_gooddollar_reserve_swap`, `supply_aave`, `withdraw_aave`), governance (`execute_lock_celo`, `execute_vote`, `execute_upvote`, …), staking (`execute_stake`, `execute_activate_stake`, …), `execute_register_celo_account`, GoodDollar UBI/identity writes, and `execute_contract_function`. Humanness-gated governance/staking executes require `check_humanness` to pass first. Keys stay on your machine and are not sent to Celina's authors.

## Session wallet (local stdio)

When a signing key is configured, the server derives session wallet(s) at startup. Agents should use them like this:

1. **`get_wallet_address`** — with no `signer`, returns the default address plus **`wallets.celo`** and **`wallets.self_agent`** when both keys are set; pass `signer` to look up one wallet.
2. **Default signer:** `celo` when `CELO_PRIVATE_KEY` is set (even if Self key is also set); `self_agent` when only `SELF_AGENT_PRIVATE_KEY` is configured.
3. **Omit `address` / `wallet_address` / `from`** on wallet-scoped reads for “my” balances and activity (uses default signer).
4. **Pass `signer: "celo" | "self_agent"`** on execute tools (send, governance, staking, account register, GoodDollar connect/disconnect) to choose which configured wallet acts.
5. **Never** derive addresses from shell or read `.env`.

Wallet-scoped tools with optional address: `get_account`, token balance tools, staking/governance reads, GoodDollar reads, `get_nft_balance`, `estimate_transaction` (`from` only), contract reads (`fromAddress`).

On **hosted** MCP (no key), pass explicit addresses. `get_wallet_address` is omitted from the hosted tool list.

Browser apps using [`@andrewkimjoseph/celina-sdk`](https://www.npmjs.com/package/@andrewkimjoseph/celina-sdk) filter the same tool catalog with `surface: "browser"` and pass the user’s connected wallet on each call — see [tool catalog guide](https://github.com/andrewkimjoseph/celina-sdk/blob/main/docs/guides/tool-catalog.md) and [MCP session wallet guide](https://github.com/andrewkimjoseph/celina-sdk/blob/main/docs/guides/mcp-session-wallet.md).

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CELO_PRIVATE_KEY` | — | Main wallet for writes (send, DeFi, governance, staking, GoodDollar UBI). 64 hex chars, optional `0x` prefix. |
| `SELF_AGENT_PRIVATE_KEY` | — | Self Agent ID wallet (separate from CELO). Can be used alone for humanness-gated governance/staking. Optional `0x` prefix. |
| `SELF_AGENT_API_BASE` | `https://app.ai.self.xyz` | Override Self Agent ID REST API base URL |
| `CELO_RPC_URL_MAINNET` | Forno public RPC | Override mainnet RPC |
| `ETH_RPC_URL_MAINNET` | — | Ethereum RPC for ENS resolution |

**Account Abstraction / gas sponsorship:** Celina MCP does **not** take a Pimlico (or other) sponsorship API key. Sponsored UserOps use `@andrewkimjoseph/celina-sdk` [`createAAClient`](https://github.com/andrewkimjoseph/celina-sdk/blob/main/docs/guides/account-abstraction.md) in your app with **your** `gasSponsorship` provider credentials. Stdio `execute_*` remains EOA-only via `CELO_PRIVATE_KEY`.

Copy `.env.example` to `.env` for local development.

## Known tokens

All supported tokens live in the [`celina-sdk`](https://www.npmjs.com/package/@andrewkimjoseph/celina-sdk) token registry:

| Category | Symbols |
|----------|---------|
| Native | `CELO` |
| Mento stablecoins | `USDm`, `EURm`, `BRLm`, `XOFm`, `KESm`, `PHPm`, `COPm`, `GBPm`, `CADm`, `AUDm`, `ZARm`, `GHSm`, `NGNm`, `JPYm`, `CHFm` |
| Bridged / third-party | `USDT`, `USDC`, `vEUR`, `vGBP`, `vCHF`, `USDM`, `USDA`, `EURA`, `USDGLO`, `BRLA`, `COPM` |
| GoodDollar | `GoodDollar`, `G$` (`0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A`) |

Token symbols are resolved case-insensitively. Mento legacy tickers (`cUSD`, `cEUR`, `cKES`, `PUSO`, `cREAL`, `eXOF`, etc.) map to the current `XXXm` names. You can also pass a known registry contract address.

- `get_celo_balances` — named registry tokens (defaults to `CELO` + `USDm`)
- `get_stablecoin_balances` — scan all registry stablecoins in one call (omits zero balances by default)

## Tools

Full schemas and handlers live in [`@andrewkimjoseph/celina-sdk/tools`](../celina-sdk/docs/guides/tool-catalog.md). MCP registers them via `registerSdkTools` — no per-tool files in this repo.

### Core

| Tools | Notes |
|-------|-------|
| `get_network_status`, `get_block`, `get_latest_blocks`, `get_transaction` | Chain reads |
| `check_attribution_tag`, `verify_attribution_tag` | ERC-8021 attribution on txs |
| `get_wallet_address` | Stdio only — default + dual-wallet addresses |
| `get_account`, `get_celo_account_registration`, `execute_register_celo_account` | Account balance, nonce, Celo Accounts registration |
| `resolve_ens` | Celo + Ethereum ENS |

### Tokens and DeFi

| Tools | Notes |
|-------|-------|
| `get_celo_balances`, `get_stablecoin_balances`, `get_token_info`, `get_token_balance` | Registry token reads |
| `get_gas_fee_data`, `estimate_transaction`, `estimate_send`, `send_token` | Sends (stdio writes) |
| `get_mento_fx_quote`, `estimate_mento_fx`, `execute_mento_fx` | Mento FX |
| `get_uniswap_quote`, `estimate_uniswap_swap`, `execute_uniswap_swap` | Uniswap v4 |
| `get_aave_balances`, `supply_aave`, `withdraw_aave` | Aave V3 Celo |
| `get_gooddollar_*`, `claim_daily_gooddollar_ubi`, `execute_gooddollar_reserve_swap`, `get_gooddollar_face_verification_link`, `execute_connect_gooddollar_identity`, `execute_disconnect_gooddollar_identity` | GoodDollar identity, UBI, reserve — see [GoodDollar](#gooddollar) |

### Governance (humanness-gated writes)

| Reads | Stdio executes |
|-------|----------------|
| `get_governance_proposals`, `get_proposal_details`, `get_votable_proposals`, `get_governance_votes`, `get_locked_celo_balance`, `get_pending_withdrawals` | `execute_lock_celo`, `execute_unlock_celo`, `execute_relock_celo`, `execute_withdraw_celo`, `execute_vote`, `execute_upvote`, `execute_revoke_governance_votes`, `execute_revoke_governance_upvote` |

Queue flow: `get_governance_proposals` (Queued) → `execute_upvote`. Referendum flow: `get_votable_proposals` → `execute_vote`. Call `check_humanness` before any execute.

### Staking (humanness-gated writes)

| Reads | Stdio executes |
|-------|----------------|
| `get_staking_balances`, `get_activatable_stakes`, `get_validator_groups`, `get_validator_group_details`, `get_total_staking_info`, `get_delegation_info`, `get_governance_delegates`, `get_stake_eligibility` | `execute_stake`, `execute_activate_stake`, `execute_unstake`, `execute_delegate_power`, `execute_undelegate_power` |

Call `get_stake_eligibility` before `execute_stake` — groups at capacity (e.g. cLabs) will fail.

### Governance delegation discovery

When the user asks who to delegate to: `get_governance_delegates` → pick a delegatee `address` → `get_delegation_info` + `get_locked_celo_balance` → `execute_delegate_power`. The Celo Mondo directory is curated off-chain (not an on-chain registry); any address can receive delegation.

### Humanness

| Tool | Notes |
|------|-------|
| `check_humanness` | Passes if Self Agent ID **or** GoodDollar whitelist succeeds for the address; gates governance/staking executes |

### NFT and contract

| Tools | Notes |
|-------|-------|
| `get_nft_info`, `get_nft_balance` | ERC-721 / ERC-1155 |
| `call_contract_function`, `estimate_contract_gas`, `execute_contract_function` | Caller-supplied ABI |

### Self Agent ID

| Reads | Stdio session / signing |
|-------|-------------------------|
| `verify_self_agent`, `lookup_self_agent`, `verify_self_request` | `register_self_agent`, `check_self_registration`, `refresh_self_proof`, `deregister_self_agent`, `get_self_identity`, `sign_self_request`, `authenticated_self_fetch` |

See [Self Agent ID notes](#self-agent-id-notes) below.

### AgentKarma

| Tools | Notes |
|-------|-------|
| `get_agentkarma_reputation`, `get_agentkarma_celo_agent`, `check_agentkarma_counterparty` | Read-only external API; hosted requires explicit `address` |

### Swap routing (Mento FX, GoodDollar reserve, Uniswap v4)

Three swap routes are available. Pick based on the token pair:

| Route | Best for | Quote tool | Execute (MCP) |
|-------|----------|------------|---------------|
| **Mento FX** | Mento oracle stables (USDm, EURm, CELO, …) | `get_mento_fx_quote` | `estimate_mento_fx` → `execute_mento_fx` |
| **GoodDollar reserve** | **G$ ↔ USDm** (bonding curve) | `get_gooddollar_reserve_quote` | `estimate_gooddollar_reserve_swap` → `execute_gooddollar_reserve_swap` |
| **Uniswap v4** | AMM pairs (e.g. G$ → USDT, USDC → USDT) | `get_uniswap_quote` | `estimate_uniswap_swap` → `execute_uniswap_swap` |

**G$ ↔ USDm** uses the GoodDollar reserve — not Uniswap (pools are typically illiquid). **G$ → USDT** and similar AMM pairs use Uniswap when Mento FX has no route. CELO swaps on Uniswap route through WCELO pools — the signer needs WCELO (wrapped CELO) balance, not native CELO. All on-chain steps include Celina ERC-8021 Schema 0 attribution (`celina` + optional app codes). Prefer `check_attribution_tag` to confirm tx tags on a tx hash. Sponsored UserOps use the SDK [`createAAClient`](https://andrewkimjoseph.gitbook.io/celina-sdk/guides/account-abstraction) in your app — Celina MCP does not host Pimlico/gas sponsorship keys.

Recommended LLM flow: quote the relevant route(s), compare `expectedOut`, then estimate and execute on the better route (or use SDK `prepareReserveSwap` / `prepare_swap` for user wallet signing on reserve swaps).

### GoodDollar

#### UBI

Daily G$ claims via UBISchemeV2 on Celo (`0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1`). Identity must be whitelisted; connected wallets resolve to their verified root. Balance and reserve tools use the literal wallet address only. **One claim per identity per UBI period.**

| Tool | Type | Notes |
|------|------|-------|
| `get_gooddollar_identity_link` | read | Root vs connected-wallet link |
| `get_gooddollar_whitelisting_info` | read | IdentityV4 status, reverification timeline (root-resolved) |
| `get_gooddollar_ubi_entitlement` | read | Claimable G$, whitelist root, eligibility reasons |
| `claim_daily_gooddollar_ubi` | write | Claims for MCP server wallet (`CELO_PRIVATE_KEY`); stdio only |

Recommended flow: `get_gooddollar_ubi_entitlement` → `claim_daily_gooddollar_ubi` (or use SDK `prepareClaimUbi` + wagmi for user wallet signing).

#### Reserve swaps (G$ ↔ USDm)

On-chain **MentoBroker** bonding curve — the canonical route for GoodDollar ↔ USDm. MCP can **quote**, **estimate**, and **execute** on stdio with `CELO_PRIVATE_KEY`. Browser apps use `prepare_gooddollar_reserve_swap` or `prepare_swap`.

| Tool | Type | Notes |
|------|------|-------|
| `get_gooddollar_reserve_quote` | read | Hosted + stdio; pair-limited to G$ ↔ USDm |
| `estimate_gooddollar_reserve_swap` | read* | Gas estimate (*needs `CELO_PRIVATE_KEY`) |
| `execute_gooddollar_reserve_swap` | write | Stdio only; signs approve + broker `swapIn` |

Details: [celina-sdk GoodDollar guide](../celina-sdk/docs/guides/gooddollar.md).

### Self Agent ID notes

- **Registration lifecycle APIs** (`register_self_agent`, `refresh_self_proof`, `deregister_self_agent`) use `network: "mainnet"` in the Self REST API request body.
- **Demo and gated HTTP endpoints** (e.g. `https://app.ai.self.xyz/api/demo/verify`) require the query param **`network=celo-mainnet`**, not `network=mainnet`.
- **QR scan URLs** use `/scan/{sessionToken}`, not `/qr/...`.
- **`refresh_self_proof`** only starts after on-chain proof expiry (`isProofFresh` is false); while fresh it returns a clear error instead of a QR that will fail on-chain. The 30-day `is_expiring_soon` flag (matching Self SDK `isProofExpiringSoon`) is for warnings only. Self SDK also documents deregister → re-register as an alternative renewal path.

Example authenticated demo call:

```text
authenticated_self_fetch
  method: POST
  url: https://app.ai.self.xyz/api/demo/verify?network=celo-mainnet
  body: {}
```

## Adding a new tool

1. Add a `ToolDefinition` in **celina-sdk** `src/tools/domains/` and export it from `ALL_TOOL_DEFINITIONS` (see [`@andrewkimjoseph/celina-sdk/tools`](https://github.com/andrewkimjoseph/celina-sdk/blob/main/docs/guides/tool-catalog.md)).
2. MCP picks it up automatically via `registerSdkTools` in `src/tools/sdk-register.ts` — no per-tool MCP file required.
3. Add domain logic in celina-sdk services if the handler needs new client methods.
4. Rebuild both packages: `npm run build` in celina-sdk, then celina-mcp.

Set `surfaces` on the definition (`"mcp"`, `"browser"`, or both) and use `filterToolDefinitions` options (`serverKeyToolsEnabled`, `estimateToolsEnabled`) to control hosted vs stdio exposure.

## For developers

### Architecture split

Chain logic comes from [`@andrewkimjoseph/celina-sdk`](https://www.npmjs.com/package/@andrewkimjoseph/celina-sdk) via [`src/context/app-context.ts`](src/context/app-context.ts). Write tools call SDK `prepare*` methods, then [`executePreparedFlow`](src/services/execute-prepared-flow.ts) simulates each step with [`simulatePreparedStep`](https://www.npmjs.com/package/@andrewkimjoseph/celina-sdk/simulation) before signing:

| Layer | Source | Examples |
|-------|--------|----------|
| Reads | celina-sdk | balances, blocks, quotes, governance/staking reads, GoodDollar, ENS, humanness |
| DeFi writes | SDK `prepare*` + local executor | `send_token`, Mento/Uniswap/reserve/Aave executes |
| Governance / staking writes | `governanceWrite`, `stakingWrite` | `execute_lock_celo`, `execute_stake`, … (humanness-gated) |
| Account / GoodDollar identity | `accountWrite`, `gooddollarIdentityWrite`, `gooddollarFaceVerification` | `execute_register_celo_account`, connect/disconnect, face verification link |
| Self Agent ID | celina-sdk `client.self` | registration, proof refresh, authenticated fetch (`SELF_AGENT_PRIVATE_KEY`) |

Before each `wallet.sendTransaction`, `executePreparedFlow` calls `simulatePreparedStep` from `@andrewkimjoseph/celina-sdk/simulation`. Reverts are caught **before gas is spent**; a post-mine `receipt.status` check remains as a safety net. No `feeCurrency` — the server wallet pays CELO gas.

Mento FX routing uses `@mento-protocol/mento-sdk` transitively through celina-sdk — MCP does not import it directly.

Self Agent ID is implemented in [`@andrewkimjoseph/celina-sdk`](https://www.npmjs.com/package/@andrewkimjoseph/celina-sdk) (`client.self`). For browser-first Self UIs, also see [`@selfxyz/agent-sdk`](https://www.npmjs.com/package/@selfxyz/agent-sdk).

### Directory map

| Path | Purpose |
|------|---------|
| `src/index.ts` | stdio MCP bootstrap — loads env, connects transport |
| `src/server/` | `createServer()` factory and LLM instructions |
| `src/context/` | Composes SDK client + MCP runtime (wallet, executors, hooks) |
| `src/tools/` | `registerSdkTools` — registers filtered `ALL_TOOL_DEFINITIONS` from celina-sdk |
| `src/services/` | Wallet executor (`execute-prepared-flow.ts`) for signed broadcasts |
| `src/config/` | Env, token registry, Self constants |

Tool schemas, descriptions, and handlers live in **celina-sdk** `src/tools/domains/`. MCP only wires them to `@modelcontextprotocol/sdk` — see [Adding a new tool](#adding-a-new-tool).

### Local development

```bash
npm run dev          # watch TypeScript → build/
npm run inspect      # MCP Inspector UI over stdio
```

Point your MCP client at the built entry for source development:

```json
"args": ["/absolute/path/to/celina-mcp/build/index.js"]
```

Copy `.env.example` to `.env` for `CELO_PRIVATE_KEY`, `SELF_AGENT_PRIVATE_KEY`, and RPC overrides.

## Roadmap

- [x] Mento FX routing (`get_mento_fx_quote`, `estimate_mento_fx`, `execute_mento_fx`)
- [x] Uniswap v4 swaps (`get_uniswap_quote`, `estimate_uniswap_swap`, `execute_uniswap_swap`)
- [x] Aave tools (`get_aave_balances`, `supply_aave`, `withdraw_aave`) — USDT, WETH, USDm, USDC, CELO, EURm
- [x] Self proof verification (`verify_self_agent`, `verify_self_request`, `ai.self.xyz`)
- [x] Self Agent ID check (`lookup_self_agent`, registration & lifecycle tools)
- [x] Governance executes (`execute_lock_celo`, `execute_vote`, `execute_upvote`, …)
- [x] Staking executes (`execute_stake`, `execute_activate_stake`, delegate/undelegate)
- [x] Governance delegate discovery (`get_governance_delegates` — Celo Mondo directory)
- [x] Humanness gate (`check_humanness`) and GoodDollar identity connect/disconnect

## License

MIT

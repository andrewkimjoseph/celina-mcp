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

For chain reads and unsigned Carbon prepares without a local install, use the hosted Streamable HTTP endpoint at [https://mcp.usecelina.xyz/api/mcp](https://mcp.usecelina.xyz/api/mcp) — see [Hosted (reads + prepare)](#hosted-reads--prepare).

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

**Read telemetry:** Off-chain tool usage is logged via the bundled Celina SDK. Each MCP install gets a stable `device_id` (`~/.config/celina/install-id`) so stats can distinguish hosts; wallet-scoped reads also set Amplitude `user_id` to the public wallet address (from tool args or the `CELO_PRIVATE_KEY` signer). Opt out with `CELINA_ANALYTICS_DISABLED=1`; override with `CELINA_ANALYTICS_DEVICE_ID`.

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

Read-only tools (balances, blocks, GoodDollar status, etc.) work out of the box. For write tools, set `CELO_PRIVATE_KEY` in the MCP server `env` block.

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

A public hosted endpoint is available at **https://mcp.usecelina.xyz/api/mcp** (alias: `/mcp`). Use this when you need chain reads and unsigned `prepare_carbon_*` flows without a local `npx` install.

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

**Works without keys:** all `get_*` tools, `resolve_ens`, `get_mento_fx_quote`, `get_uniswap_quote`, `get_gooddollar_whitelisting_info`, `get_gooddollar_ubi_entitlement`, `get_gooddollar_reserve_quote`, `estimate_transaction`, `get_gas_fee_data`, `verify_self_agent`, `lookup_self_agent`, governance/staking/NFT/contract reads, and all **12 Carbon DeFi read tools** (see [Carbon DeFi](#carbon-defi-on-celo)), etc.

**Hosted MCP:** **60 tools** — reads, **`prepare_carbon_*`** (unsigned flows with approve + Carbon steps), and estimates (pass explicit `from` when no server wallet). **`execute_carbon_*`**, server-key writes (`send_token`, `execute_mento_fx`, `execute_gooddollar_reserve_swap`, etc.), `get_wallet_address`, and Self lifecycle/registration tools require **local stdio** with `CELO_PRIVATE_KEY` / `SELF_AGENT_PRIVATE_KEY`.

**Fails gracefully:** `send_token`, `execute_mento_fx`, `execute_uniswap_swap`, `execute_gooddollar_reserve_swap`, `supply_aave`, `withdraw_aave`, `claim_daily_gooddollar_ubi`, `estimate_send`, `estimate_mento_fx`, `estimate_uniswap_swap`, `estimate_gooddollar_reserve_swap` (require local `CELO_PRIVATE_KEY` via stdio).

**Unreliable on serverless:** `register_self_agent` / `check_self_registration` — Self sessions are in-memory and do not persist across stateless function invocations.

See [celina-mcp-host/README.md](../celina-mcp-host/README.md) if you want to deploy your own instance.

## Write tools

Set `CELO_PRIVATE_KEY` in your MCP server `env` block for on-chain writes (`send_token`, `estimate_send`, `execute_mento_fx`, `execute_uniswap_swap`, `execute_gooddollar_reserve_swap`, `supply_aave`, `withdraw_aave`, `claim_daily_gooddollar_ubi`). Use `SELF_AGENT_PRIVATE_KEY` for Self agent signing tools. Keys stay on your machine and are not sent to Celina's authors.

## Session wallet (local stdio)

When `CELO_PRIVATE_KEY` is set, the server derives a **session wallet** at startup (`privateKeyToAccount` → `ctx.config.walletAddress`). Agents should use it like this:

1. **`get_wallet_address`** — returns the signer when you need the address as data (empty input).
2. **Omit `address` / `wallet_address` / `from`** on wallet-scoped reads and `prepare_carbon_*` for “my” balances, strategies, and activity.
3. **Never** derive addresses from shell or read `.env`.

Wallet-scoped tools with optional address: `get_account`, token balance tools, staking reads, GoodDollar reads, `get_nft_balance`, `get_carbon_strategies`, `get_carbon_activity`, `estimate_transaction` (`from` only), contract reads (`fromAddress`), and all `prepare_carbon_*`.

On **hosted** MCP (no key), pass explicit addresses. `get_wallet_address` returns an error without a configured key.

Browser apps using [`@andrewkimjoseph/celina-sdk`](https://www.npmjs.com/package/@andrewkimjoseph/celina-sdk) filter the same tool catalog with `surface: "browser"` and pass the user’s connected wallet on each call — see [tool catalog guide](https://github.com/andrewkimjoseph/celina-sdk/blob/main/docs/guides/tool-catalog.md) and [MCP session wallet guide](https://github.com/andrewkimjoseph/celina-sdk/blob/main/docs/guides/mcp-session-wallet.md).

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CELO_PRIVATE_KEY` | — | Write tools (send, Mento FX, Uniswap v4, Aave, GoodDollar UBI claim) |
| `SELF_AGENT_PRIVATE_KEY` | — | Self Agent ID signing/identity tools (separate from CELO wallet) |
| `SELF_AGENT_API_BASE` | `https://app.ai.self.xyz` | Override Self Agent ID REST API base URL |
| `CELO_RPC_URL_MAINNET` | Forno public RPC | Override mainnet RPC |

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

| Tool | Type | Description |
|------|------|-------------|
| `get_network_status` | read | Mainnet chain ID, block, gas price |
| `get_block` | read | Block by number/hash/latest (optional `includeTransactions`) |
| `get_latest_blocks` | read | Recent blocks (optional `offset`, up to 100) |
| `get_transaction` | read | Tx + receipt |
| `get_wallet_address` | read | Signer address from `CELO_PRIVATE_KEY` (stdio) |
| `get_account` | read | CELO balance, nonce (omit `address` for configured signer) |
| `resolve_ens` | read | Resolve Celo or Ethereum ENS name |
| `get_celo_balances` | read | Named registry token balances (default: CELO + USDm) |
| `get_stablecoin_balances` | read | Scan all registry stablecoins; omits zero balances by default |
| `get_token_info` | read | Registry token metadata (no balance read) |
| `get_token_balance` | read | Single registry token balance (symbol or known registry address) |
| `get_gas_fee_data` | read | Current gas fees (EIP-1559 when supported) |
| `estimate_transaction` | read | Generic tx gas estimate (from/to/value/data) |
| `estimate_send` | read* | Token send gas estimate (*needs `CELO_PRIVATE_KEY`) |
| `send_token` | write | Send CELO or ERC-20 |
| `get_mento_fx_quote` | read | Mento FX expected output (no wallet) |
| `estimate_mento_fx` | read* | Mento FX gas estimate (*needs `CELO_PRIVATE_KEY`) |
| `execute_mento_fx` | write | Execute Mento FX conversion |
| `get_uniswap_quote` | read | Uniswap v4 expected output (no wallet) |
| `estimate_uniswap_swap` | read* | Uniswap v4 gas estimate incl. Permit2 approvals (*needs `CELO_PRIVATE_KEY`) |
| `execute_uniswap_swap` | write | Execute Uniswap v4 swap (Universal Router + Permit2) |
| `supply_aave` | write | Supply tokens to Aave V3 on Celo (USDT, WETH, USDm, USDC, CELO, EURm) |
| `withdraw_aave` | write | Withdraw tokens from Aave V3 on Celo |
| `get_gooddollar_whitelisting_info` | read | GoodDollar IdentityV4 whitelist status |
| `get_gooddollar_ubi_entitlement` | read | Daily UBI claim eligibility (amount, whitelist root, reasons) |
| `get_gooddollar_reserve_quote` | read | G$ ↔ USDm quote via GoodDollar MentoBroker reserve (bonding curve) |
| `estimate_gooddollar_reserve_swap` | read* | Reserve swap gas estimate (*needs `CELO_PRIVATE_KEY`) |
| `execute_gooddollar_reserve_swap` | write | Execute G$ ↔ USDm reserve swap via MentoBroker |
| `claim_daily_gooddollar_ubi` | write | Claim today's GoodDollar UBI (G$) for the MCP server wallet |
| `get_governance_proposals` | read | Celo governance proposals (paginated) |
| `get_proposal_details` | read | Governance proposal details + CGP content |
| `get_staking_balances` | read | Staking votes by validator group |
| `get_activatable_stakes` | read | Pending stakes ready to activate |
| `get_validator_groups` | read | Validator groups (paginated) |
| `get_validator_group_details` | read | Single validator group details |
| `get_total_staking_info` | read | Network-wide staking totals |
| `get_nft_info` | read | NFT token info + metadata |
| `get_nft_balance` | read | NFT balance (ERC-721 or ERC-1155) |
| `call_contract_function` | read | Read-only contract call (caller ABI) |
| `estimate_contract_gas` | read | Contract function gas estimate (caller ABI) |
| `verify_self_agent` | read | Verify Self Agent ID on-chain by address |
| `lookup_self_agent` | read | Look up Self agent by numeric ID (ai.self.xyz) |
| `verify_self_request` | read | Verify signed Self Agent HTTP request headers |
| `register_self_agent` | write | Start Self agent registration (QR/deep link) |
| `check_self_registration` | read* | Poll registration/refresh/deregister session (*may return private key) |
| `get_self_identity` | read* | Current Self agent identity (*needs agent key) |
| `refresh_self_proof` | write | Renew human proof after on-chain expiry (`isProofFresh` false) |
| `deregister_self_agent` | write | Irreversibly revoke Self agent identity |
| `sign_self_request` | read* | Sign HTTP request with Self agent headers (*needs agent key) |
| `authenticated_self_fetch` | write | HTTP fetch with Self agent auth (*needs agent key) |

### Carbon DeFi on Celo

38 Carbon tools (12 read + 13 prepare + 13 execute) for Carbon maker strategies and taker swaps on Celo mainnet (hybrid Carbon REST + `@bancor/carbon-sdk`). Hosted MCP includes read + **`prepare_carbon_*`** (unsigned, full approve + Carbon steps via `finalizeCarbonPrepare`); **`execute_carbon_*`** requires **local stdio** with `CELO_PRIVATE_KEY`. Token symbols are normalized to `0x` addresses before Carbon REST.

| Tool | Type | Description |
|------|------|-------------|
| `get_carbon_strategies` | read | Active maker strategies for a wallet (call before create/manage) |
| `get_carbon_strategy` | read | Strategy by NFT id (status, prices, budgets, fills) |
| `get_carbon_trade_quote` | read | Taker swap quote against Carbon liquidity (SDK fallback if REST fails) |
| `explore_carbon_pair` | read | Liquidity and top strategies for a base/quote pair |
| `resolve_carbon_token` | read | Resolve symbol/name to Celo address (Carbon API + Celina registry fallback) |
| `get_carbon_activity` | read | Trade and event history for wallet or strategy |
| `find_carbon_opportunities` | read | Discount buys / premium sells vs market on a pair |
| `get_carbon_protocol_stats` | read | TVL, volume, fees (optional `period_days`, up to 30) |
| `get_carbon_price_history` | read | Historical OHLC for a pair |
| `simulate_carbon_strategy` | read | Backtest strategy config (up to 365 days) before committing capital |
| `carbon_help` | read | Per-tool guidance (`topic` optional) |
| `carbon_learn` | read | Protocol education (`topic` optional, e.g. `recurring_strategy`) |
| `prepare_carbon_limit_order` | prepare* | One-time limit order (unsigned) |
| `prepare_carbon_range_order` | prepare* | Range order — gradual execution (unsigned) |
| `prepare_carbon_recurring_strategy` | prepare* | Recurring buy/sell strategy; makers pay no gas on fills (unsigned) |
| `prepare_carbon_concentrated_strategy` | prepare* | Concentrated two-sided liquidity (unsigned) |
| `prepare_carbon_full_range_strategy` | prepare* | Full-range liquidity (unsigned) |
| `prepare_carbon_reprice_strategy` | prepare* | Update price ranges of existing strategy (unsigned) |
| `prepare_carbon_edit_strategy` | prepare* | Edit prices, budgets, optional type (unsigned) |
| `prepare_carbon_deposit_budget` | prepare* | Add funds to strategy (unsigned) |
| `prepare_carbon_withdraw_budget` | prepare* | Withdraw funds from strategy (unsigned) |
| `prepare_carbon_pause_strategy` | prepare* | Pause strategy; funds remain (unsigned) |
| `prepare_carbon_resume_strategy` | prepare* | Resume paused strategy (unsigned) |
| `prepare_carbon_delete_strategy` | prepare* | Permanently close strategy (unsigned) |
| `prepare_carbon_trade` | prepare* | Taker swap against Carbon liquidity (unsigned) |
| `execute_carbon_limit_order` | write* | One-time limit order (local sign + broadcast) |
| `execute_carbon_range_order` | write* | Range order (local sign + broadcast) |
| `execute_carbon_recurring_strategy` | write* | Recurring buy/sell strategy (local sign + broadcast) |
| `execute_carbon_concentrated_strategy` | write* | Concentrated two-sided liquidity (local sign + broadcast) |
| `execute_carbon_full_range_strategy` | write* | Full-range liquidity (local sign + broadcast) |
| `execute_carbon_reprice_strategy` | write* | Update price ranges (local sign + broadcast) |
| `execute_carbon_edit_strategy` | write* | Edit prices and budgets (local sign + broadcast) |
| `execute_carbon_deposit_budget` | write* | Add funds to strategy (local sign + broadcast) |
| `execute_carbon_withdraw_budget` | write* | Withdraw funds (local sign + broadcast) |
| `execute_carbon_pause_strategy` | write* | Pause strategy (local sign + broadcast) |
| `execute_carbon_resume_strategy` | write* | Resume strategy (local sign + broadcast) |
| `execute_carbon_delete_strategy` | write* | Close strategy (local sign + broadcast) |
| `execute_carbon_trade` | write* | Taker swap (local sign + broadcast) |

\* **`execute_carbon_*`** omitted on hosted MCP (`carbonExecuteEnabled: false`). **`prepare_carbon_*`** returns full `preparedFlow` steps (approvals + Carbon tx) and API **`warnings`**. Execute requires `CELO_PRIVATE_KEY`. Prices are **quote per 1 base**; buy budget in quote, sell budget in base. Carbon API rate limit ~30 req/min — avoid burst parallel calls.

Recommended flow: `get_carbon_strategies` → `explore_carbon_pair` / `get_carbon_trade_quote` → `simulate_carbon_strategy` (when sizing capital) → **`execute_carbon_*`** (local MCP wallet) or `prepare_carbon_*` (external wallet signing).

Details: [celina-sdk Carbon guide](../celina-sdk/docs/guides/carbon.md).

### Swap routing (Mento FX, GoodDollar reserve, Uniswap v4)

Three swap routes are available. Pick based on the token pair:

| Route | Best for | Quote tool | Execute (MCP) |
|-------|----------|------------|---------------|
| **Mento FX** | Mento oracle stables (USDm, EURm, CELO, …) | `get_mento_fx_quote` | `estimate_mento_fx` → `execute_mento_fx` |
| **GoodDollar reserve** | **G$ ↔ USDm** (bonding curve) | `get_gooddollar_reserve_quote` | `estimate_gooddollar_reserve_swap` → `execute_gooddollar_reserve_swap` |
| **Uniswap v4** | AMM pairs (e.g. G$ → USDT, USDC → USDT) | `get_uniswap_quote` | `estimate_uniswap_swap` → `execute_uniswap_swap` |

**G$ ↔ USDm** uses the GoodDollar reserve — not Uniswap (pools are typically illiquid). **G$ → USDT** and similar AMM pairs use Uniswap when Mento FX has no route. CELO swaps on Uniswap route through WCELO pools — the signer needs WCELO (wrapped CELO) balance, not native CELO. All on-chain steps include the CELINA attribution tag.

Recommended LLM flow: quote the relevant route(s), compare `expectedOut`, then estimate and execute on the better route (or use SDK `prepareReserveSwap` / `prepare_swap` for user wallet signing on reserve swaps).

### GoodDollar

#### UBI

Daily G$ claims via UBISchemeV2 on Celo (`0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1`). Identity must be whitelisted; connected wallets resolve to their verified root. **One claim per identity per day.**

| Tool | Type | Notes |
|------|------|-------|
| `get_gooddollar_whitelisting_info` | read | IdentityV4 status, reverification timeline |
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

Set `surfaces` on the definition (`"mcp"`, `"browser"`, or both) and use `filterToolDefinitions` options (`carbonPrepareEnabled`, `carbonExecuteEnabled`) to control hosted vs stdio exposure.

## For developers

### Architecture split

Chain logic comes from [`@andrewkimjoseph/celina-sdk`](https://www.npmjs.com/package/@andrewkimjoseph/celina-sdk) via [`src/context/app-context.ts`](src/context/app-context.ts). Write tools call SDK `prepare*` methods, then [`executePreparedFlow`](src/services/execute-prepared-flow.ts) signs each step with `CELO_PRIVATE_KEY`:

| Layer | Source | Examples |
|-------|--------|----------|
| Reads | celina-sdk | balances, blocks, Mento/Uniswap/reserve quotes, GoodDollar whitelist/UBI/reserve, ENS, Carbon reads/simulate |
| Writes | SDK `prepare*` + local executor | `send_token`, `execute_mento_fx`, `execute_uniswap_swap`, `execute_gooddollar_reserve_swap`, `supply_aave`, `withdraw_aave`, `claim_daily_gooddollar_ubi`, `execute_carbon_*` |
| Carbon prepare | celina-sdk `carbon.prepare*` | `prepare_carbon_*` — unsigned only; external wallet signing |
| Carbon execute | celina-sdk `carbon.prepare*` + `buildExecutionSteps` + `executePreparedFlow` | `execute_carbon_*` — local `CELO_PRIVATE_KEY` |
| Self Agent ID | celina-sdk `client.self` | registration, proof refresh, authenticated fetch (`SELF_AGENT_PRIVATE_KEY`) |

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
- [x] Aave lending tools (`supply_aave`, `withdraw_aave`) — USDT, WETH, USDm, USDC, CELO, EURm
- [x] Self proof verification (`verify_self_agent`, `verify_self_request`, `ai.self.xyz`)
- [x] Self Agent ID check (`lookup_self_agent`, registration & lifecycle tools)
- [x] Carbon DeFi on Celo — 38 MCP tools (12 read + 13 prepare + 13 execute); see [celina-sdk carbon guide](../celina-sdk/docs/guides/carbon.md)
- [ ] Cross-chain bridging — bridge tokens to/from Celo (`get_bridge_quote`, `estimate_bridge`, `execute_bridge`)

## Development

```bash
npm run dev          # watch TypeScript
npm run inspect      # MCP Inspector UI (stdio)
```

## License

MIT

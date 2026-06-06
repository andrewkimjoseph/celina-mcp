# Announcing Celina: Celo SDK, MCP Server, and Hosted MCP for AI Agents & Apps

> **Unofficial community tooling.** Celina is **not** an official Celo Foundation product, endorsement, or supported infrastructure. It is open-source software published by **Canvassing Intelligence** for builders who want agent- and wallet-friendly access to **Celo mainnet**. Use at your own risk; always verify transactions in your wallet.

**TL;DR:** **Canvassing Intelligence** is releasing a three-layer stack for building on **Celo mainnet** with AI agents and modern web wallets:

| Layer | Package / deployment | What it does |
|-------|----------------------|--------------|
| **SDK** | [`@andrewkimjoseph/celina-sdk`](https://www.npmjs.com/package/@andrewkimjoseph/celina-sdk) | Chain reads + **unsigned** transaction preparation (no private keys in your app) |
| **MCP** | [`@andrewkimjoseph/celina-mcp`](https://www.npmjs.com/package/@andrewkimjoseph/celina-mcp) | Model Context Protocol server for Cursor, Claude Desktop, LM Studio, VS Code / Continue, etc. |
| **MCP Host** | [https://mcp.usecelina.xyz/api/mcp](https://mcp.usecelina.xyz/api/mcp) | Public **read-only + Carbon prepare** endpoint over Streamable HTTP (Vercel) |

All three are **open source (MIT)**, **Celo mainnet only**, and designed so humans keep custody: agents and backends prepare flows; **wallets sign**.

---

## About Canvassing

**[Canvassing](https://thecanvassing.xyz)** is an umbrella for work across Celo and beyond. Website: [thecanvassing.xyz](https://thecanvassing.xyz). On this forum, follow or message **Canvassing** via the **[forum profile](https://forum.celo.org/u/canvassing/summary)**.

Two wings sit under the umbrella today:

| Wing | Focus |
|------|--------|
| **Canvassing Insights** | Day-one goal: a **research marketplace** — connecting researchers and participants around structured insight work (including paid online surveys rewarded in stablecoins). |
| **Canvassing Intelligence** | The **AI wing** — tooling for agents, MCP, and on-chain preparation flows (including **Celina**). |

Celina is a **Canvassing Intelligence** project. It is separate from Canvassing Insights' marketplace roadmap, though both share the same builder ethos: useful tools for real people on real chains—without implying official protocol backing.

---

## Why Canvassing Intelligence built this

Celo is mobile-first, stablecoin-rich, and increasingly agent-shaped—but LLMs and IDE assistants still struggle to do useful on-chain work without:

- A consistent **token registry** (USDm, EURm, CELO, GoodDollar, bridged stables, etc.)
- Safe **read → quote → estimate → prepare → sign** patterns
- First-class coverage of **Celo-native DeFi** (Mento FX, GoodDollar reserve, Uniswap v4 on Celo, Aave V3, Carbon DeFi, GoodDollar UBI, governance, staking)
- A standard way to plug into **MCP** clients without every team re-wiring viem calls

**Celina** ("Celo" + agent tooling) is Canvassing Intelligence's answer: one TypeScript SDK, one MCP server, and one hosted endpoint so you can start in an IDE in minutes or embed the SDK in a product with wagmi.

---

## The three layers (how they fit together)

```text
┌─────────────────────────────────────────────────────────────┐
│  Your app (React + wagmi)  OR  MCP client (Cursor, Claude)   │
└───────────────────────────┬─────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
   celina-sdk         celina-mcp         celina-mcp-host
   (npm library)      (stdio / npx)      (HTTPS on Vercel)
         │                  │                  │
         └──────────────────┴──────────────────┘
                            │
                    Celo mainnet (reads + prepare*)
                    *writes only with local keys (stdio)
```

### 1. Celina SDK — `@andrewkimjoseph/celina-sdk`

**For:** Frontend apps, backends, and any TypeScript service that should **never hold user keys**.

**Capabilities:**

- **Reads:** balances, blocks, txs, ENS, governance, staking, NFTs, contract calls (caller-supplied ABI), GoodDollar whitelist/UBI/reserve quotes, Carbon DeFi exploration, and more
- **Prepare:** returns `SerializedPreparedFlow` — ordered unsigned steps for **wagmi** `sendTransactionAsync` / viem `walletClient.sendTransaction`
- **Attribution:** every calldata step gets a **CELINA suffix** (`appendCelinaCalldataTag`) so on-chain activity can be attributed consistently (sends, Mento, Uniswap, Aave, GoodDollar, Carbon controller txs)

**Install:**

```bash
npm i @andrewkimjoseph/celina-sdk
```

Requires **Node.js ≥ 20**.

**Minimal example:**

```ts
import { createCelinaClient } from "@andrewkimjoseph/celina-sdk";

const celina = createCelinaClient();

await celina.token.getStablecoinBalances("0xYourAddress");

const flow = await celina.transaction.prepareSend(
  "0xFrom",
  "0xTo",
  "USDm",
  "10"
);
// flow.steps → wagmi sendTransactionAsync (user signs in wallet)
```

**Docs:** [GitBook — Celina SDK](https://andrewkimjoseph.gitbook.io/celina-sdk)  
**Repo:** [github.com/andrewkimjoseph/celina-sdk](https://github.com/andrewkimjoseph/celina-sdk)

---

### 2. Celina MCP — `@andrewkimjoseph/celina-mcp`

**For:** AI agents in **Cursor**, **Claude Desktop**, **LM Studio**, **Continue**, MCP Inspector, or any MCP-capable stack.

Celina MCP wraps the SDK and exposes **dozens of tools** your model can call: chain reads, quotes, gas estimates, optional **local writes** when you provide keys, Carbon maker/taker flows, Self Agent ID lifecycle tools, and more.

**Recommended setup (local stdio — full power, keys stay on your machine):**

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

- Omit both keys for **read-only** usage.
- **`CELO_PRIVATE_KEY`:** `send_token`, Mento/Uniswap/Aave executes, GoodDollar claim, **`execute_carbon_*`**
- **`SELF_AGENT_PRIVATE_KEY`:** Self Agent ID signing tools (separate from your CELO wallet)

**Session wallet (stdio with `CELO_PRIVATE_KEY`):**

- Call `get_wallet_address` when you need the signer as data
- On many tools, **omit** `address` / `wallet_address` / `from` for "my wallet" reads and Carbon prepare
- Never derive addresses from shell or scrape `.env` in prompts

**Install:**

```bash
npm i @andrewkimjoseph/celina-mcp@latest
```

**Website:** [usecelina.xyz](https://usecelina.xyz)  
**Repo:** [github.com/andrewkimjoseph/celina-mcp](https://github.com/andrewkimjoseph/celina-mcp)

**Migration note:** If you still use `@andrewkimjoseph/celina`, update MCP config to `@andrewkimjoseph/celina-mcp` and rename the server key to `celina-mcp`.

---

### 3. Celina MCP Host — hosted Streamable HTTP

**For:** Quick onboarding, shared teams, or clients that only support **remote MCP URLs**—without installing Node tooling locally.

**Production endpoint:** [https://mcp.usecelina.xyz/api/mcp](https://mcp.usecelina.xyz/api/mcp)  
(alias: `/mcp` rewrites to `/api/mcp`)

**Client config (read-only hosted — no private keys):**

```json
{
  "mcpServers": {
    "celina-mcp": {
      "url": "https://mcp.usecelina.xyz/api/mcp"
    }
  }
}
```

**Hosted surface (~73 tools):**

- All **`get_*`** reads, ENS, governance, staking, NFTs, contract reads
- Mento / Uniswap **quotes** (not executes)
- GoodDollar whitelist + UBI **entitlement** reads + **G$ ↔ USDm reserve quote** (`get_gooddollar_reserve_quote`)
- Carbon **12 read tools** + **13 `prepare_carbon_*`** (full unsigned flows including approvals)
- Self **verify / lookup** reads

**Intentionally disabled on hosted (no server keys):**

- `send_token`, `execute_mento_fx`, `execute_uniswap_swap`, Aave supply/withdraw, `claim_daily_gooddollar_ubi`
- All **`execute_carbon_*`**
- `get_wallet_address`
- Self registration sessions are **unreliable** on stateless serverless (in-memory session TTL)

**Do not send private keys to the hosted URL.** For writes and Carbon execute, use **local stdio** MCP.

**Deploy your own:** [github.com/andrewkimjoseph/celina-mcp-host](https://github.com/andrewkimjoseph/celina-mcp-host) (Vercel, imports `createServer` from `@andrewkimjoseph/celina-mcp/server` with `carbonExecuteEnabled: false`).

---

## What you can do today (feature highlights)

### Stablecoins & transfers

- Registry-backed tokens: CELO, Mento stables (`USDm`, `EURm`, …), USDC/USDT, GoodDollar (`G$`), and more
- `get_stablecoin_balances`, `get_celo_balances`, `get_token_balance`
- Sends with ENS support; **CELO uses GoldToken ERC-20 transfer** (Celo token duality—same balance as native CELO)

### DeFi routing

| Route | Best for | MCP flow |
|-------|----------|----------|
| **Mento FX** | Oracle-priced Mento assets (USDm, EURm, CELO, …) | `get_mento_fx_quote` → `estimate_mento_fx` → `execute_mento_fx` |
| **GoodDollar reserve** | **G$ ↔ USDm** (bonding curve) | `get_gooddollar_reserve_quote` (quote only; prepare via SDK/wallet) |
| **Uniswap v4** | AMM pairs (e.g. G$ → USDT) | `get_uniswap_quote` → `estimate_uniswap_swap` → `execute_uniswap_swap` |
| **Aave V3 on Celo** | Supply / withdraw | `supply_aave`, `withdraw_aave` |

**G$ ↔ USDm** uses the GoodDollar reserve — not Uniswap. CELO swaps on Uniswap route through **WCELO**; the signer needs wrapped CELO balance for those pools.

### Carbon DeFi on Celo (38 MCP tools)

Hybrid **Carbon REST** + `@bancor/carbon-sdk` for maker strategies and taker swaps on [celo.carbondefi.xyz](https://celo.carbondefi.xyz):

- **Reads:** strategies, pair exploration, quotes, simulation, protocol stats, opportunities, education (`carbon_help`, `carbon_learn`)
- **Prepare:** limit/range/recurring/concentrated/full-range orders, edit/reprice/deposit/withdraw/pause/resume/delete, taker trade prep
- **Execute (stdio only):** local sign-and-broadcast with `CELO_PRIVATE_KEY`; makers pay **no gas on fills** for recurring strategies

Recommended agent flow: `get_carbon_strategies` → explore/quote → `simulate_carbon_strategy` → prepare or execute; always surface **`warnings`** from prepare/execute responses.

### GoodDollar

- Read whitelist status and daily entitlement
- **G$ ↔ USDm reserve quote** on hosted MCP (`get_gooddollar_reserve_quote`); unsigned prepare via SDK/wallet apps
- MCP: `claim_daily_gooddollar_ubi` with server wallet (stdio)
- Apps: `prepareClaimUbi`, `prepareReserveSwap`, or `prepare_swap` + wagmi for **user wallet** signing (one UBI claim per verified identity per day)

### Self Agent ID ([ai.self.xyz](https://ai.self.xyz) on Celo mainnet)

- Verify agents, lookup by ID, registration QR/deep link flows
- Authenticated demo APIs: use `?network=celo-mainnet` (not `mainnet`)
- Separate **`SELF_AGENT_PRIVATE_KEY`** from CELO wallet

### Governance, staking, NFTs, contracts

- Governance proposals + CGP metadata
- Validator groups, staking balances, activatable stakes
- ERC-721 / ERC-1155 reads
- `call_contract_function` / `estimate_contract_gas` with caller ABI (read-only)

---

## Security model (please read)

1. **SDK:** No private keys—only unsigned preparation. Users sign in Valora, MetaMask, Rabby, etc.
2. **MCP stdio:** Keys live in **your** MCP `env`, on your machine—not sent to Canvassing Intelligence or the hosted MCP endpoint.
3. **MCP host:** **No keys on the server**; writes and Carbon execute are blocked or error clearly.
4. **Telemetry:** Anonymous read telemetry via SDK (stable install id at `~/.config/celina/install-id`). Opt out: `CELINA_ANALYTICS_DISABLED=1`.

---

## How this relates to other Celo AI tooling

The ecosystem also has the official **[Celo MCP from celo-org](https://docs.celo.org/build-on-celo/build-with-ai/mcp/celo-mcp)** (Python, broad blockchain access). **Celina** is **unofficial**, **TypeScript-native**, and **mainnet-focused**:

- Prepared flows + wagmi integration
- Deep integrations: **Mento, GoodDollar reserve, Uniswap v4, Aave, Carbon, GoodDollar UBI, Self Agent ID**
- A **hosted MCP** endpoint for zero-install reads and Carbon prepare

They can coexist in different clients; pick based on language, deployment model, and DeFi coverage.

---

## Try it in 60 seconds

**Hosted (no install):** Add to Cursor / Claude MCP settings:

```json
{
  "mcpServers": {
    "celina-mcp": {
      "url": "https://mcp.usecelina.xyz/api/mcp"
    }
  }
}
```

Then ask: *"What are the USDm and CELO balances of `0x…`?"* or *"Explore Carbon liquidity for CELO/USDC."*

**Local (writes enabled):** Use the stdio config in the Celina MCP section above with your own key, then: *"What is my wallet address?"* → *"Estimate sending 1 USDm to …"*

**App builders:** `npm i @andrewkimjoseph/celina-sdk` + [wagmi integration guide](https://andrewkimjoseph.gitbook.io/celina-sdk/guides/wagmi-integration).

---

## Latest stats

Live dashboard: **[usecelina.xyz/stats](https://usecelina.xyz/stats)** — on-chain activity and npm adoption, refreshed every ~5 minutes.

| Metric | Value |
|--------|------:|
| **On-chain total** — Celo mainnet txs tagged `CELINA` | 74 |
| **On-chain today** | 7 |
| **Off-chain total** — MCP tool calls (Amplitude) | 0 |
| **Off-chain (7d)** | 0 |
| **npm downloads (365d)** — `@andrewkimjoseph/celina-mcp` | 10,826 |
| **npm downloads (7d)** | 5,949 |

**Drill-down:**

- [On-chain](https://usecelina.xyz/stats/onchain) — volume, hourly cadence, top counterparties (Dune)
- [Off-chain](https://usecelina.xyz/stats/offchain) — reads, registry lookups, and other non-chain MCP invocations
- [Package](https://usecelina.xyz/stats/package) — daily, weekly, and monthly npm download trends

*Snapshot from the live dashboard, June 3, 2026. Numbers update automatically on the site.*

---

## Roadmap (public)

**Shipped:**

- Mento FX, GoodDollar reserve, Uniswap v4, Aave V3 on Celo
- Self proof verification + Agent ID lifecycle tools
- Carbon DeFi — 25 SDK operations / 38 MCP tools
- GoodDollar UBI + reserve reads; UBI claim (MCP stdio) / prepare (SDK)

**Next:**

- Cross-chain bridging (`getBridgeQuote`, `estimateBridge`, `prepareBridge`)

---

## Links

| Resource | URL |
|----------|-----|
| Canvassing (umbrella) | https://thecanvassing.xyz |
| Canvassing on Celo Forum | https://forum.celo.org/u/canvassing/summary |
| Celina website | https://usecelina.xyz |
| Celina stats | https://usecelina.xyz/stats |
| Hosted MCP | https://mcp.usecelina.xyz/api/mcp |
| SDK (npm) | https://www.npmjs.com/package/@andrewkimjoseph/celina-sdk |
| MCP (npm) | https://www.npmjs.com/package/@andrewkimjoseph/celina-mcp |
| SDK docs (GitBook) | https://andrewkimjoseph.gitbook.io/celina-sdk |
| SDK repo | https://github.com/andrewkimjoseph/celina-sdk |
| MCP repo | https://github.com/andrewkimjoseph/celina-mcp |
| MCP host repo | https://github.com/andrewkimjoseph/celina-mcp-host |

**Current versions (npm):** SDK `0.4.12`, MCP `0.8.10`

---

## Feedback for Canvassing Intelligence

If you build agents, miniapps, or wallet flows on Celo, **Canvassing Intelligence** would like to hear:

- Which MCP client you use (Cursor, Claude, LM Studio, other)
- Whether **hosted read + Carbon prepare** is enough for your team, or you need self-hosted MCP host
- Missing tokens, protocols, or prepare flows for your use case

Reply in this thread with wallets-as-`0x…` examples (no private keys), feature requests, or integrations you are building—the team is actively iterating.

---

*Published by **Canvassing Intelligence** (AI wing of **[Canvassing](https://thecanvassing.xyz)**). **Unofficial** — not affiliated with or endorsed by the Celo Foundation. MIT licensed. Celo mainnet only. More about the umbrella: [thecanvassing.xyz](https://thecanvassing.xyz) · Forum: [canvassing](https://forum.celo.org/u/canvassing/summary).*

---

## Suggested forum metadata (optional — do not paste into post body)

- **Suggested title:** `Announcing Celina (unofficial) — SDK, MCP & Hosted MCP from Canvassing Intelligence`
- **Suggested category:** Developers / Build on Celo / AI
- **Tags:** `mcp`, `ai`, `sdk`, `agents`, `defi`, `carbon`, `gooddollar`, `mainnet`

# HyperNatt Terminal — Agent Quickstart

**Platform:** [https://hypernatt.com](https://hypernatt.com) — full HyperNatt product (vault, assistant, stats). **This doc** covers the **hypernatt-terminal** MCP brick only (`/mcp/protocol`).

**Humans (Claude / Cursor):** see [Try in 30 Seconds](../README.md#try-it-in-30-seconds) in the README — add connector `https://hypernatt.com/mcp/protocol`, then ask:

> *Call get_agent_manifest, then get the BTC vault signal from HyperNatt.*

**Agents:** this guide describes MCP/REST operations in production.

**Tool reference:** [../tools/](../tools/) · **Smithery:** https://smithery.ai/servers/hypernatt/hypernatt-terminal

---

## What you get (before the first tool call)

Three production samples — [full doc](example-responses.md). Order: **trap → vault → hunt**.

**`get_mm_trap_state`** (1 credit):

```json
{
  "state": "MM_TRAP_ACTIVE",
  "trap_direction": "DOWN_HUNT_LONGS",
  "sweep_zone": { "low": 56933, "high": 58667 },
  "chart_verdicts": { "hunt": "SWEEP_MATH_FAIL", "reclaim": "RECLAIM_MATH_OK" }
}
```

**`get_btc_usdc_signal`** (1 credit, HOLD free):

```json
{
  "cycle": { "direction": "LONG", "cycle_id": "C94D4BB60", "total_legs": 4 },
  "has_active": true
}
```

**`get_mm_hunt_score`** (1 credit):

```json
{
  "mm_hunt_score": -35,
  "magnet_bias": "BEARISH_MAGNET",
  "pressure_direction": "DOWN_HUNT_LONGS"
}
```

---

## Free tier and pricing (F#43N)

| Tier | What you get |
|------|----------------|
| **Free** | **25 shared credits/day** on all Decision Core tools (no wallet) |
| **Intro** | **First call per Decision Core tool per day is free** (taste each product) |
| **HOLD** | `get_btc_usdc_signal` **HOLD** verdict = **0 charge** |
| **Credit cost** | All 5 Decision Core tools = **1 credit** (~$0.01) each |
| **Agent Pass** | **$19/mo** → **2000 credits** / 30 days |
| **Pro Pass** | **$49/mo** → **7000 credits** / 30 days |
| **Swap bonus** | ~20 credits per $100 swapped via NattSwap (see quota status) |
| **Paygo** | **$0.01 USDC** / credit via x402 on Base |

**Paywall order:** free tier → swap quotas → Agent Pass → Pro Pass → paygo.

> *25 shared credits/day + intro-free per tool (~32/day). Swap to earn more. Or $19/mo for serious use.*

Status: `GET https://hypernatt.com/api/m2m/pass/status` · `GET https://hypernatt.com/api/m2m/quota/status`

---

## What is HyperNatt Terminal?

**[HyperNatt](https://hypernatt.com)** is the live trading + AI platform (vault UI, assistant, on-chain stats). **HyperNatt Terminal** is the **agent-facing MCP server** — one integration brick at `/mcp/protocol`, not the whole product.

The MCP exposes BTC Decision Terminal tools: live vault-backed signals, on-chain proof, cross-chain swap. Verify in real time.

Signals are produced by **Mimo**, HyperNatt's automated strategy on the public **Mimo BTC/USDC vault** on Hyperliquid (**live since 2026-02-27**).

| Resource | URL |
|----------|-----|
| App | https://hypernatt.com |
| Public track record | https://hypernatt.com/stats |
| Hyperliquid vault | https://app.hyperliquid.xyz/vaults/0x04e2eb302fe9ff23a9d1f2455084af624737a6d8 |
| Smithery | https://smithery.ai/servers/hypernatt/hypernatt-terminal |
| Glama server | https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal |
| Documentation repo | https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal |

### How to connect (MCP)

| Method | URL |
|--------|-----|
| **Direct (recommended)** | `https://hypernatt.com/mcp/protocol` |
| **Smithery proxy** | `https://mcp.smithery.ai/hypernatt/hypernatt-terminal` |
| SSE transport | `https://hypernatt.com/mcp/sse` |
| Server card | `https://hypernatt.com/.well-known/mcp/server-card.json` |

The terminal exposes **9 MCP tools** (v2.5.11): orientation, proof, **cross-chain swap**, and five Decision Core reads.

**Quota program (live):** https://hypernatt.com/api/m2m/quota/status — bonus Decision Core credits from NattSwap volume (~20 per $100).

**Important:** Paid tools return **read-only BTC/USDC context**. They are **not** trade recommendations or execution instructions.

---

## Step 1 — Discover what's available (free)

Call **`get_agent_manifest`** (or `GET /api/m2m/agent/manifest`). Optional input: `{ "locale": "en" }`.

| Section | Pricing | Purpose |
|---------|---------|---------|
| **Decision Core** | $0.01 USD/call (or **quota bypass**) | Vault-backed BTC context — five tools |
| **Execution** | Free | Li.Fi cross-chain swap |
| **Execution** | Free | Li.Fi cross-chain swap quotes (NattSwap) |

### Decision Core — five paid tools

| Tool | Role | Credits |
|------|------|---------|
| `get_btc_usdc_signal` | Cycle direction (**LONG** / **SHORT** / **HOLD**) from the live vault | **1** (HOLD free) |
| `get_mm_hunt_score` | Microstructure pressure & liquidation-hunt context | **1** |
| `get_similarity_match` | Top-3 historical regime matches & ~4h outcomes | **1** |
| `get_liq_radar` | Raw liquidation radar: magnet, OI, clusters, real liqs | **2** |
| `get_mm_trap_state` | Live MM trap/sweep state (redacted strict) | **2** |

Public price: **$0.01 USDC** via **x402** on **Base** (`eip155:8453`). With quota balance: pass **`agent_wallet`** and skip payment.

---

## Step 2 — Test the free cross-chain swap

| Tool | When to use |
|------|-------------|
| `swap_via_nattswap` | Li.Fi quote + step-by-step execution instructions (any Li.Fi-routed chain pair) |
| `swap_quote` | Raw Li.Fi quote JSON only |

Swaps are free at the MCP layer; revenue is integrator fees on execution, not x402 on quotes.

---

## Step 3 — Decision Core ($0.01 each, or quota)

1. Check `GET https://hypernatt.com/api/m2m/quota/balance?wallet=0x…` — remaining credits.
2. Call without payment → x402 instructions (402 on REST), **unless** quota balance covers the tool weight.
3. Pay **$0.01 USDC** on Base (if no quota).
4. Retry with `x_payment` / `X-Payment`.

Suggested order for a full picture (pro stack):

1. `get_mm_trap_state` — manipulation weather (flagship, 1 credit)
2. `get_btc_usdc_signal` — vault cycle now (HOLD free)
3. `get_mm_hunt_score` — hunt / trap pressure summary
4. `get_similarity_match` — historical analogies
5. `get_liq_radar` — raw microstructure block (commodity, 1 credit)

Cross-check: vault on Hyperliquid + https://hypernatt.com/stats

---

## Reference — all 9 MCP tools

| # | Tool | Price |
|---|------|-------|
| 1 | `get_agent_manifest` | Free |
| 2 | `get_vault_proof` | Free |
| 3 | `get_mm_trap_state` | 1 credit / $0.01 x402 or quota |
| 4 | `get_btc_usdc_signal` | 1 credit; **HOLD free** |
| 5 | `get_mm_hunt_score` | 1 credit / $0.01 x402 or quota |
| 6 | `get_similarity_match` | 1 credit / $0.01 x402 or quota |
| 7 | `get_liq_radar` | 1 credit / $0.01 x402 or quota |
| 8 | `swap_via_nattswap` | Free |
| 9 | `swap_quote` | Free |

Per-tool docs: [../tools/](../tools/)

---

## REST endpoints (non-MCP agents)

| Endpoint | Description |
|----------|-------------|
| `GET /api/m2m/agent/manifest` | Same as `get_agent_manifest` |
| `GET /api/m2m/quota/status` | Quota program params (public) |
| `GET /api/m2m/quota/balance` | Wallet quota balance (public) |
| `GET /api/m2m/stats/usage` | Public 24h usage counters |
| `GET /api/m2m/signal` | Paid signal (x402 or quota) |
| `GET /api/m2m/mm-hunt` | Paid MM hunt (x402 or quota) |
| `GET /api/m2m/similarity-match` | Paid similarity (x402 or quota) |
| `GET /api/m2m/liq-radar` | Paid liq radar (x402 or quota) |
| `GET /api/m2m/mm-trap-state` | Paid MM trap state (x402 or quota) |

Base URL: `https://hypernatt.com`

---

## Install via Smithery

```bash
npx -y @smithery/cli@latest mcp add hypernatt/hypernatt-terminal
```

---

*Document version: hypernatt-terminal MCP v2.5.11 (9 tools, ecosystem homepage discovery + session resilience).*

# HyperNatt Terminal — Agent Quickstart

This guide is for autonomous AI agents connecting to **hypernatt-terminal** via MCP or REST. It describes what exists in production today and a practical order of operations.

**Tool reference:** [../tools/](../tools/) · **Smithery:** https://smithery.ai/servers/hypernatt/hypernatt-terminal

---

## What is HyperNatt Terminal?

**HyperNatt Terminal** is a BTC Decision Terminal for AI Agents — live vault-backed signals, on-chain proof, cross-chain swap. Verify in real time.

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

The terminal exposes **14 MCP tools** (v2.5.0): orientation, proof, swap, five Decision Core reads (beta eligible), and NDAT rewards.

**Beta program (live):** https://hypernatt.com/api/m2m/beta/status — first **100 external wallets** get Decision Core **free for life**. Enroll after **≥2 tools** succeed within 24h. Use `agent_wallet` on MCP paid tools (or `X-Agent-Wallet` on REST) to bypass x402 when grandfathered.

**Important:** Paid tools return **read-only context**. They are **not** trade recommendations or execution instructions.

---

## Step 1 — Discover what's available (free)

Call **`get_agent_manifest`** (or `GET /api/m2m/agent/manifest`). Optional input: `{ "locale": "en" }`.

| Section | Pricing | Purpose |
|---------|---------|---------|
| **Decision Core** | $0.01 USD/call (or **free** if beta-grandfathered) | Vault-backed BTC context — five tools |
| **Proof & Performance** | Free | Natt agent on-chain metrics |
| **Execution** | Free | Li.Fi swap quotes (NattSwap) |
| **Rewards & Referral** | Free | NDAT + referral |

### Decision Core — five paid tools

| Tool | Role |
|------|------|
| `get_btc_usdc_signal` | Cycle direction (**LONG** / **SHORT** / **HOLD**) from the live vault |
| `get_mm_hunt_score` | Microstructure pressure & liquidation-hunt context |
| `get_similarity_match` | Top-3 historical regime matches & ~4h outcomes |
| `get_liq_radar` | Raw liquidation radar: magnet, OI, clusters, real liqs |
| `get_mm_trap_state` | Live MM trap/sweep state (redacted strict) |

Public price: **$0.01 USDC** via **x402** on **Base** (`eip155:8453`). Beta wallets: pass **`agent_wallet`** and skip payment when enrolled.

---

## Step 2 — Test the free swap

| Tool | When to use |
|------|-------------|
| `swap_via_nattswap` | Li.Fi quote + step-by-step execution instructions |
| `swap_quote` | Raw Li.Fi quote JSON only |

Swaps are free at the MCP layer; revenue is integrator fees on execution, not x402 on quotes.

---

## Step 3 — Decision Core ($0.01 each, or beta-free)

1. Optional: `GET https://hypernatt.com/api/m2m/beta/status` — slots remaining.
2. Call without payment → x402 instructions (402 on REST), **unless** you pass `agent_wallet` / `X-Agent-Wallet` and are grandfathered.
3. Pay **$0.01 USDC** on Base (if not beta).
4. Retry with `x_payment` / `X-Payment`.

Suggested order for a full picture:

1. `get_btc_usdc_signal` — vault cycle now
2. `get_mm_hunt_score` — hunt / trap pressure
3. `get_similarity_match` — historical analogies
4. `get_liq_radar` — raw microstructure block
5. `get_mm_trap_state` — manipulation weather (redacted)

Cross-check: vault on Hyperliquid + https://hypernatt.com/stats

---

## Step 4 — Rewards loop (free)

| Tool | Action |
|------|--------|
| `register_nattswap_reward` | Credit NDAT after completed swap tx |
| `get_agent_balance` | Pending / claimed NDAT |
| `claim_ndat` | ECDSA claim payload (you pay gas) |
| `get_referral_link` | Agent referral URL |

---

## Reference — all 14 MCP tools

| # | Tool | Price |
|---|------|-------|
| 1 | `get_agent_manifest` | Free |
| 2 | `get_vault_proof` | Free |
| 3 | `get_natt_performance` | Free |
| 4 | `get_btc_usdc_signal` | $0.01 x402 |
| 5 | `get_mm_hunt_score` | $0.01 x402 |
| 6 | `get_similarity_match` | $0.01 x402 |
| 7 | `get_liq_radar` | $0.01 x402 |
| 8 | `get_mm_trap_state` | $0.01 x402 |
| 9 | `swap_via_nattswap` | Free |
| 10 | `swap_quote` | Free |
| 11 | `get_agent_balance` | Free |
| 12 | `claim_ndat` | Free |
| 13 | `register_nattswap_reward` | Free |
| 14 | `get_referral_link` | Free |

Per-tool docs: [../tools/](../tools/)

---

## REST endpoints (non-MCP agents)

| Endpoint | Description |
|----------|-------------|
| `GET /api/m2m/agent/manifest` | Same as `get_agent_manifest` |
| `GET /api/m2m/stats/usage` | Public 24h usage counters |
| `GET /api/m2m/signal` | Paid signal (x402) |
| `GET /api/m2m/mm-hunt` | Paid MM hunt (x402) |
| `GET /api/m2m/similarity-match` | Paid similarity (x402) |
| `GET /api/m2m/liq-radar` | Paid liq radar (x402) |
| `GET /api/m2m/mm-trap-state` | Paid MM trap state (x402) |
| `GET /api/m2m/beta/status` | Beta slots + enroll window (public) |

Base URL: `https://hypernatt.com`

---

## Install via Smithery

```bash
npx -y @smithery/cli@latest mcp add hypernatt/hypernatt-terminal
```

---

*Document version: hypernatt-terminal MCP v2.5.0 (14 tools, beta grandfather).*

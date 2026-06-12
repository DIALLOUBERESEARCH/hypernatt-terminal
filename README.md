# HyperNatt Terminal

**The only BTC decision terminal backed by a live, verifiable trading vault.** 1800+ closed cycles, verifiable win rate. **Decision Core:** five BTC/USDC reads at **$0.01 USDC/call** via x402 on Base — or use **earned quotas** from NattSwap ([quota status](https://hypernatt.com/api/m2m/quota/status)). Founders: first **100** wallets with **$50+** swap volume get **2x** quota credits.

Public MCP server for autonomous AI agents. Free tools include vault proof and live agent performance. Paid Decision Core reads from the live Mimo vault — no custody, not trade advice.

| Resource | URL |
|----------|-----|
| **Glama server** | https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal |
| **Glama connector** | https://glama.ai/mcp/connectors/com.hypernatt/hypernatt-terminal |
| **Smithery** | https://smithery.ai/servers/hypernatt/hypernatt-terminal |
| **MCP endpoint** | https://hypernatt.com/mcp/protocol |
| **Agent quickstart** | [docs/quickstart.md](docs/quickstart.md) |
| **Tool reference** | [tools/](tools/) |
| **HyperNatt app** | https://hypernatt.com |
| **Public stats** | https://hypernatt.com/stats |
| **Quota program** | https://hypernatt.com/api/m2m/quota/status |
| **Hyperliquid vault** | https://app.hyperliquid.xyz/vaults/0x04e2eb302fe9ff23a9d1f2455084af624737a6d8 |

---

## What it is

HyperNatt Terminal exposes **14 MCP tools** (v2.5.1): orientation + vault proof, Natt agent performance, **cross-chain swap** (Li.Fi), five Decision Core reads, and rewards.

Signals are produced by **Mimo**, HyperNatt's automated strategy on the public **Mimo BTC/USDC vault** on Hyperliquid. The vault runs **24/7**, **live since 2026-02-27** — independently verifiable on-chain (fills, positions, vault state).

Paid Decision Core tools return **read-only BTC/USDC context** (cycle state, microstructure, historical analogies, raw liq radar, MM trap/sweep state). They are **not** trade recommendations or execution instructions. No performance promises — verify everything yourself via the vault and stats links above.

---

## Connect

| Method | URL |
|--------|-----|
| **Direct MCP (recommended)** | `https://hypernatt.com/mcp/protocol` |
| **Smithery proxy** | `https://mcp.smithery.ai/hypernatt/hypernatt-terminal` |
| **SSE transport** | `https://hypernatt.com/mcp/sse` |
| **Server card** | `https://hypernatt.com/.well-known/mcp/server-card.json` |

```bash
npx -y @smithery/cli@latest mcp add hypernatt/hypernatt-terminal
```

Start with the free tool **`get_agent_manifest`** — catalog, pricing, live 24h usage, and proof links.

---

## Manifest sections

The terminal is organized into four sections (Decision Core first). Same structure via MCP `get_agent_manifest` or `GET https://hypernatt.com/api/m2m/agent/manifest`.

### Decision Core

Five Decision Core tools (**$0.01 USDC each** via **x402 on Base**, or **quota bypass** when your wallet has earned credits from NattSwap). Pass **`agent_wallet`** (MCP) or header **`X-Agent-Wallet`** (HTTP). Check balance: `GET https://hypernatt.com/api/m2m/quota/balance?wallet=0x…`. Backed by the Mimo **BTC/USDC** vault (live since **2026-02-27**).

| Tool | Role | Price |
|------|------|-------|
| [`get_btc_usdc_signal`](tools/get_btc_usdc_signal.md) | Cycle direction & conviction (**LONG** / **SHORT** / **HOLD**) from the live vault | $0.01 x402 or quota |
| [`get_mm_hunt_score`](tools/get_mm_hunt_score.md) | Microstructure pressure & liquidation-hunt context | $0.01 x402 or quota |
| [`get_similarity_match`](tools/get_similarity_match.md) | Top-3 historical regime matches & observed ~4h BTC outcomes | $0.01 x402 or quota |
| [`get_liq_radar`](tools/get_liq_radar.md) | Raw liquidation radar: magnet score, OI, clusters, real liquidations | $0.01 x402 or quota |
| [`get_mm_trap_state`](tools/get_mm_trap_state.md) | Live MM trap state: hunt direction, sweep zones, verdicts (redacted) | $0.01 x402 or quota |

### Proof & Performance

On-chain verifiable metrics for **Natt**, HyperNatt's reference trading agent on Base (CDP wallet).

| Tool | Role | Price |
|------|------|-------|
| [`get_natt_performance`](tools/get_natt_performance.md) | Live trading performance of Natt — PnL, winrate, APR, verifiable on-chain | Free |

### Execution

**Cross-chain swap** via **Li.Fi** (NattSwap) across **Li.Fi-routed chains**. Free at the MCP layer — monetized via integrator fees on execution, not x402 on quotes. **Does not** change Decision Core pair policy (BTC/USDC only).

| Tool | Role | Price |
|------|------|-------|
| [`swap_via_nattswap`](tools/swap_via_nattswap.md) | Li.Fi quote + step-by-step agent execution instructions | Free |
| [`swap_quote`](tools/swap_quote.md) | Raw Li.Fi quote JSON only | Free |

### Rewards & Referral

NDAT rewards from completed swap volume. Refer other agents.

| Tool | Role | Price |
|------|------|-------|
| [`get_agent_balance`](tools/get_agent_balance.md) | Pending and claimed NDAT for your wallet | Free |
| [`claim_ndat`](tools/claim_ndat.md) | ECDSA claim payload to withdraw NDAT on Base (you pay gas) | Free |
| [`register_nattswap_reward`](tools/register_nattswap_reward.md) | Register a completed swap tx hash to credit NDAT + quotas | Free |
| [`get_referral_link`](tools/get_referral_link.md) | Referral URL for agent-to-agent invites | Free |

### Orientation (call first)

| Tool | Role | Price |
|------|------|-------|
| [`get_agent_manifest`](tools/get_agent_manifest.md) | Catalog, journey, sections, live 24h usage stats | Free |
| [`get_vault_proof`](tools/get_vault_proof.md) | On-chain vault proof + signed cycle snapshot hash | Free |

---

## Run locally (Docker)

Self-hosted MCP server for Glama evaluation and local dev. Production endpoint remains `https://hypernatt.com/mcp/protocol`.

```bash
docker build -t hypernatt-terminal .
docker run --rm -p 8011:8011 hypernatt-terminal
curl -sS http://127.0.0.1:8011/health
```

| Path | Description |
|------|-------------|
| `GET /health` | Liveness |
| `GET /tools` | REST tool catalog |
| `POST /protocol` | MCP Streamable HTTP |
| `GET /sse` | MCP SSE transport |

Default env points read-only signal backends to production (`https://hypernatt.com`). Override `M2M_SERVICE_URL` / `GATEWAY_URL` if needed.

[![DIALLOUBE-RESEARCH/hypernatt-terminal MCP server](https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal/badges/score.svg)](https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal)

---

## Suggested agent journey

1. **`get_agent_manifest`** — discover tools and pricing (free).
2. **`get_natt_performance`** — see live Natt agent PnL / winrate (free, on-chain).
3. **`swap_via_nattswap`** — test a free cross-chain quote; **`register_nattswap_reward`** to earn quotas + NDAT.
4. **Decision Core** — five vault-backed BTC/USDC reads ($0.01 or quota bypass).
5. **`get_agent_balance`** → **`claim_ndat`** — rewards loop.
6. **`get_referral_link`** — grow your agent network.

Full walkthrough: [docs/quickstart.md](docs/quickstart.md)

---

## REST endpoints (non-MCP agents)

| Endpoint | Description |
|----------|-------------|
| `GET /api/m2m/agent/manifest` | Same as `get_agent_manifest` (includes `quota_program`) |
| `GET /api/m2m/quota/status` | Quota program params + founder slots (public) |
| `GET /api/m2m/quota/balance?wallet=0x…` | Quota balance for wallet (public) |
| `GET /api/m2m/stats/usage` | Public 24h usage counters |
| `GET /api/m2m/signal` | Paid signal (x402 or quota) |
| `GET /api/m2m/mm-hunt` | Paid MM hunt (x402 or quota) |
| `GET /api/m2m/similarity-match` | Paid similarity (x402 or quota) |
| `GET /api/m2m/liq-radar` | Paid liq radar (x402 or quota) |
| `GET /api/m2m/mm-trap-state` | Paid MM trap state (x402 or quota) |

Base URL: `https://hypernatt.com`

---

## Verify on-chain

- **Vault:** https://app.hyperliquid.xyz/vaults/0x04e2eb302fe9ff23a9d1f2455084af624737a6d8
- **Track record:** https://hypernatt.com/stats
- **Natt agent:** use `get_natt_performance` → `wallet_basescan_url`

Every paid signal payload includes proof links so you can reconcile JSON with public Hyperliquid data yourself.

---

## License

MIT — see [LICENSE](LICENSE).

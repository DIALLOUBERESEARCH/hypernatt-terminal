# HyperNatt Terminal

**BTC decision terminal backed by a live, verifiable trading vault.** 1800+ closed cycles — [public track record](https://hypernatt.com/stats). **Free daily credits** on all Decision Core tools. **HOLD signals are free.** Agent Pass from **$19/mo**. Cross-chain swap via Li.Fi.

Public MCP server for AI agents and humans (Claude, Cursor). Vault-backed MM intelligence — not trade advice.

| Resource | URL |
|----------|-----|
| **Public stats** | https://hypernatt.com/stats |
| **MCP endpoint** | https://hypernatt.com/mcp/protocol |
| **Smithery** | https://smithery.ai/servers/hypernatt/hypernatt-terminal |
| **Quota program** | https://hypernatt.com/api/m2m/quota/status |
| **Pass / free tier** | https://hypernatt.com/api/m2m/pass/status |

---

## Try It in 30 Seconds

No code. No API key. No npm install required.

**Step 1.** Claude → Settings → Integrations → **Add custom connector**

**Step 2.**

| Field | Value |
|-------|-------|
| Name | `HyperNatt Terminal` |
| URL | `https://hypernatt.com/mcp/protocol` |

**Step 3.** Ask Claude:

> *Call get_agent_manifest, then get_mm_trap_state from HyperNatt — is the MM trapping right now?*

**Cursor / Claude Desktop** — remote MCP config:

```json
{
  "mcpServers": {
    "hypernatt-terminal": {
      "url": "https://hypernatt.com/mcp/protocol"
    }
  }
}
```

```bash
npx -y @smithery/cli@latest mcp add hypernatt/hypernatt-terminal
```

---

## What you get (live examples)

Three real production responses (2026-06-13). **Trap → vault → hunt** — the pro stack.

### 1. `get_mm_trap_state` (2 credits) — MM trap weather

```json
{
  "state": "MM_TRAP_ACTIVE",
  "trap_direction": "DOWN_HUNT_LONGS",
  "cluster_price": 57800,
  "sweep_zone": { "low": 56933, "high": 58667 },
  "chart_verdicts": { "hunt": "SWEEP_MATH_FAIL", "reclaim": "RECLAIM_MATH_OK" }
}
```

### 2. `get_btc_usdc_signal` (1 credit · HOLD free) — live vault

```json
{
  "cycle": { "direction": "LONG", "cycle_id": "C94D4BB60", "total_legs": 4 },
  "vault_wallet_redacted": "0x04e2…a6d8",
  "has_active": true
}
```

### 3. `get_mm_hunt_score` (1 credit) — hunt summary

```json
{
  "mm_hunt_score": -35,
  "magnet_bias": "BEARISH_MAGNET",
  "pressure_direction": "DOWN_HUNT_LONGS",
  "alert_level": "orange"
}
```

Full fields + curls: **[docs/example-responses.md](docs/example-responses.md)**

---

## Pricing (at a glance)

| | Free | Agent $19/mo | Pro $49/mo | Paygo |
|---|------|--------------|------------|-------|
| MCP install | Yes | Yes | Yes | Yes |
| Daily credits (shared pool, all DC tools) | **10/day** | — | — | — |
| Credit cost per tool | 1 credit (signal, hunt, similarity) · **2 credits** (liq_radar, mm_trap_state) | same | same | per credit |
| Monthly credits | — | **2000** | **7000** | — |
| HOLD signal | **Free** | **Free** | **Free** | **Free** |
| Swap bonus credits | Yes | Yes | Yes | Yes |

Decision Core = five tools at **$0.01/credit** when credits exhausted (x402 USDC on Base).

**Paywall funnel (in order):** 10 free credits/day → **swap earns bonus credits** → Agent Pass $19/mo → Pro $49/mo → paygo $0.01/credit.

> *10 free credits/day. Swap to earn more. Or $19/mo for serious use.*

---

## What it is

HyperNatt Terminal exposes **14 MCP tools** (v2.5.3): orientation + vault proof, Natt agent performance, **cross-chain swap** (Li.Fi), five Decision Core reads, and rewards.

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

Five vault-backed **BTC/USDC** reads (live Mimo vault since **2026-02-27**). Paywall order: **10 free credits/day** (no wallet on MCP session) → **Agent Pass** / **Pro Pass** → **swap-earned quotas** (`agent_wallet` or `X-Agent-Wallet`) → **$0.01 USDC/credit** via x402 on Base. **`get_btc_usdc_signal` HOLD verdicts are always free.** Status: `GET https://hypernatt.com/api/m2m/pass/status` · quota balance: `GET https://hypernatt.com/api/m2m/quota/balance?wallet=0x…`

| Tool | Role | Price |
|------|------|-------|
| [`get_mm_trap_state`](tools/get_mm_trap_state.md) | **Flagship** — live MM trap/sweep/reclaim weather (2 credits) | 10 free/day, pass, quota, or $0.01 |
| [`get_btc_usdc_signal`](tools/get_btc_usdc_signal.md) | Cycle direction & conviction (**LONG** / **SHORT** / **HOLD**) from the live vault | **HOLD free**; else 1 credit |
| [`get_mm_hunt_score`](tools/get_mm_hunt_score.md) | Microstructure pressure & liquidation-hunt summary (1 credit) | 10 free/day, pass, quota, or $0.01 |
| [`get_similarity_match`](tools/get_similarity_match.md) | Top-3 historical regime matches & observed ~4h BTC outcomes | 10 free/day, pass, quota, or $0.01 |
| [`get_liq_radar`](tools/get_liq_radar.md) | Raw liquidation radar — clusters, OI, magnet (2 credits; commodity layer) | 10 free/day, pass, quota, or $0.01 |

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

**Pro stack (trader / agent workflow):**

1. **`get_agent_manifest`** — catalog, pricing, live examples (free).
2. **`get_mm_trap_state`** — is the MM trapping? sweep/reclaim verdicts (2 credits).
3. **`get_btc_usdc_signal`** — what is the live vault doing? (**HOLD free**).
4. **`get_mm_hunt_score`** — one-line hunt pressure summary (1 credit).

**Growth funnel (optional):**

5. **`swap_via_nattswap`** → **`register_nattswap_reward`** — earn quota credits + NDAT.
6. **`get_agent_balance`** → **`claim_ndat`** — rewards on Base.
7. **`get_referral_link`** — invite other agents.

Full walkthrough: [docs/quickstart.md](docs/quickstart.md)

---

## REST endpoints (non-MCP agents)

| Endpoint | Description |
|----------|-------------|
| `GET /api/m2m/agent/manifest` | Same as `get_agent_manifest` (includes `pass_program`, `quota_program`, onboarding) |
| `GET /api/m2m/pass/status` | Agent Pass / Pro Pass pricing + free tier params (public) |
| `GET /api/m2m/free-tier/remaining` | Remaining free credits today (header `X-Client-Key` optional) |
| `GET /api/m2m/quota/status` | Quota program params + founder slots (public) |
| `GET /api/m2m/quota/balance?wallet=0x…` | Quota balance for wallet (public) |
| `GET /api/m2m/stats/usage` | Public 24h usage counters |
| `GET /api/m2m/signal` | Signal (free tier / pass / quota / x402; HOLD free) |
| `GET /api/m2m/mm-hunt` | MM hunt (free tier / pass / quota / x402) |
| `GET /api/m2m/similarity-match` | Similarity (free tier / pass / quota / x402) |
| `GET /api/m2m/liq-radar` | Liq radar (free tier / pass / quota / x402) |
| `GET /api/m2m/mm-trap-state` | MM trap state (free tier / pass / quota / x402) |

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

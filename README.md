# HyperNatt Terminal

**BTC Decision Terminal for AI Agents — live vault-backed signals, on-chain proof, cross-chain swap. Verify in real time.**

Public MCP server for autonomous AI agents. Read-only Hyperliquid BTC context from the live Mimo vault, free cross-chain swap quotes, and NDAT rewards — no custody, no trade advice.

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
| **Hyperliquid vault** | https://app.hyperliquid.xyz/vaults/0x04e2eb302fe9ff23a9d1f2455084af624737a6d8 |

---

## What it is

HyperNatt Terminal exposes **11 MCP tools** (v2.2.0): orientation + vault proof, swap, signals, and rewards.

Signals are produced by **Mimo**, HyperNatt's automated strategy on the public **Mimo BTC/USDC vault** on Hyperliquid. The vault runs **24/7** and has been live for **80+ days** — independently verifiable on-chain (fills, positions, vault state).

Paid Decision Core tools return **read-only context** (cycle state, microstructure, historical analogies). They are **not** trade recommendations or execution instructions. No performance promises — verify everything yourself via the vault and stats links above.

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

Start with the free tool **`get_agent_manifest`** — it returns the full catalog, pricing, and live 24h usage counters.

---

## Manifest sections

The terminal is organized into three sections (Decision Core first). Same structure via MCP `get_agent_manifest` or `GET https://hypernatt.com/api/m2m/agent/manifest`.

### Decision Core

Three paid tools (**$0.01 USDC each** via **x402 on Base**). Backed by the Mimo BTC/USDC vault running 24/7 for 80+ days. Use all three together for a complete decision framework. Each payload includes verification metadata (vault URL, stats URL, snapshot hash).

| Tool | Role | Price |
|------|------|-------|
| [`get_btc_usdc_signal`](tools/get_btc_usdc_signal.md) | Cycle direction & conviction (**LONG** / **SHORT** / **HOLD**) from the live vault | $0.01 x402 |
| [`get_mm_hunt_score`](tools/get_mm_hunt_score.md) | Microstructure pressure & liquidation-hunt context | $0.01 x402 |
| [`get_similarity_match`](tools/get_similarity_match.md) | Top-3 historical regime matches & observed ~4h BTC outcomes | $0.01 x402 |

### Execution

Cross-chain swap via **Li.Fi** (NattSwap). Free at the MCP layer — monetized via integrator fees on the swap route, not x402 on quotes.

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
| [`register_nattswap_reward`](tools/register_nattswap_reward.md) | Register a completed swap tx hash to credit NDAT | Free |
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
2. **`swap_via_nattswap`** — test a free cross-chain quote.
3. **Decision Core** — when you need vault-backed BTC context ($0.01 USDC each via x402).
4. **`register_nattswap_reward`** → **`get_agent_balance`** → **`claim_ndat`** — rewards loop after a completed swap.
5. **`get_referral_link`** — grow your agent network.

Full walkthrough: [docs/quickstart.md](docs/quickstart.md)

---

## REST endpoints (non-MCP agents)

| Endpoint | Description |
|----------|-------------|
| `GET /api/m2m/agent/manifest` | Same as `get_agent_manifest` |
| `GET /api/m2m/stats/usage` | Public 24h usage counters |
| `GET /api/m2m/signal` | Paid signal (x402) |
| `GET /api/m2m/mm-hunt` | Paid MM hunt (x402) |
| `GET /api/m2m/similarity-match` | Paid similarity (x402) |

Base URL: `https://hypernatt.com`

---

## Verify on-chain

- **Vault:** https://app.hyperliquid.xyz/vaults/0x04e2eb302fe9ff23a9d1f2455084af624737a6d8
- **Track record:** https://hypernatt.com/stats

Every paid signal payload includes proof links so you can reconcile JSON with public Hyperliquid data yourself.

---

## License

MIT — see [LICENSE](LICENSE).

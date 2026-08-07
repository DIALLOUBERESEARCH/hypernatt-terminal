# HyperNatt Terminal

[![CI](https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/actions/workflows/ci.yml/badge.svg)](https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/actions/workflows/ci.yml)
[![Glama](https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal/badges/score.svg)](https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal)
[![x402-list](https://x402-list.com/badge/hypernatt-terminal.svg?data=uptime)](https://x402-list.com/services/hypernatt-terminal?utm_source=badge&utm_medium=referral&utm_campaign=embed)
[![Version](https://img.shields.io/badge/version-2.7.0-green)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](./LICENSE)
[![npm audit](https://img.shields.io/badge/npm%20audit-0%20high-brightgreen)](./CHANGELOG.md)

**Forced-order map** for AI agents + **Li.Fi** cross-chain swap. Pay-per-call via x402.

Most agents (and most humans) only see classic public indicators. This MCP shows **where leveraged liquidations stack** — a market-structure layer those indicators do not expose. Read-only context. Your agent still decides.

Built by one person. Code is public. Backend is private. No custody. Not trade advice.

Full HyperNatt platform (vault, assistant): https://hypernatt.com — this repo is one agent-facing brick.

> Public mirror synced from a private monorepo. History here is mirror commits.

## Quick start (30 seconds)

No install for the hosted MCP. In **Claude → Settings → Connectors → Add custom connector**:

| Field | Value |
|-------|-------|
| Name | HyperNatt Terminal |
| URL | `https://hypernatt.com/mcp/protocol` |

Then ask:

> Call get_agent_manifest, then get_liq_radar — where is the nearest liquidation cluster on the forced-order map? Do not treat this as a trade signal.

More clients (Cursor / Cline / Codex / Windsurf): [docs/integrations.md](docs/integrations.md).

## What HyperNatt Terminal gives your agent

A map of **forced orders**: where leveraged positions will be liquidated if price reaches them (clusters, OI build-up, observed liquidations).

This is **market structure context**, not a trade signal. It shows terrain so a sovereign trading agent can judge timing, sizing, and risk with more awareness than agents that only read RSI/MACD-style public feeds.

Your agent still decides. We show the terrain.

### What your agent can do with this (honest scenarios)

#### Scenario 1 — Wait near the cluster

Price is approaching a dense liquidation zone. Your agent can wait for forced flow to print (`real_liquidations`), then reassess — **without** assuming a guaranteed reversal.

#### Scenario 2 — Size relative to distance

Cluster ~5% away vs ~0.5% away is a different risk parameter. Distance informs sizing or patience — it is **not** a prediction that the level will be hit.

#### Scenario 3 — After real liquidations, check OI

If price swept a zone and real liquidations spiked, compare with OI change. A large OI drop can mean forced flow is partly exhausted — still context, **not** an auto entry.

### Glossary (short)

| Term | Meaning |
|------|---------|
| Cluster | Zone where leveraged positions may liquidate if mark reaches it. Not a TP. |
| Nearest vs largest | Closest to mark vs most estimated size in the ±10% window — different jobs. |
| Real vs estimated | `real_liquidations` = observed; `liq_density` clusters = modeled. Both labeled. |
| `magnet.score` | Directional density bias from OI / L-S / funding. **Not** a hit probability. |

Live glossary + scenarios also ship on `get_agent_manifest` → `agent_interpretation_rules_v1`.

## What you get

| Tool | Price |
|------|-------|
| `get_agent_manifest` | Free — call first |
| `get_liq_radar` | **$0.001** x402 (Base + Solana) |
| `swap_via_nattswap` | Free at MCP (you sign; gas + Li.Fi fee on-chain) |

Whitelist `get_liq_radar`: **BTC ETH SOL BNB XRP HYPE ZEC** (omit `symbol` = BTC).

### What we do NOT claim

| We do **not** claim | What we **do** show |
|---------------------|---------------------|
| Generic Coinglass wrapper | Operator-shaped forced-order map for agents |
| Predictive Fuel Score / sweep classifier | Distance, size, OI, real liqs — labeled |
| Custody of keys or funds | Agent signs own txs |
| Trade advice / guaranteed edge | Read-only JSON context |
| More than 3 MCP tools | **Exactly 3** · v2.7.0 |
| Vault / `/stats` = Terminal P&L | Separate HyperNatt vault product |
| Independent security audit | Public code + [SECURITY.md](./SECURITY.md) |

## Try it

```bash
curl -s https://hypernatt.com/api/m2m/agent/manifest
curl -i https://hypernatt.com/api/m2m/liq-radar
```

| Step | Link |
|------|------|
| Quickstart | [docs/quickstart.md](docs/quickstart.md) |
| Integrations (5 clients + AgentKit) | [docs/integrations.md](docs/integrations.md) |
| HL terrain example (read-only) | [examples/hyperliquid/read_terrain.py](examples/hyperliquid/read_terrain.py) |
| Honest interpret example | [examples/liq_radar_interpret.py](examples/liq_radar_interpret.py) |
| CDP Bazaar checklist | [docs/cdp-bazaar-checklist.md](docs/cdp-bazaar-checklist.md) |
| Examples | [examples/](examples/) |
| Security | [SECURITY.md](SECURITY.md) |
| Buyer skill (use the MCP) | [skills/hypernatt-terminal/SKILL.md](skills/hypernatt-terminal/SKILL.md) |
| Seller skill (x402 hardening) | [solana-x402-seller-security-skill](https://github.com/DIALLOUBE-RESEARCH/solana-x402-seller-security-skill) |
| Tests | [test/](test/) — `npm test` |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |

MCP: https://hypernatt.com/mcp/protocol

### For non-crypto users (x402 wallet)

If you do not already have a funded USDC wallet, install **Coinbase Agentic Wallet MCP** first (email/OTP + card onramp — no seed phrase):

```bash
npx @coinbase/payments-mcp
```

Docs: [Agentic Wallet MCP](https://docs.cdp.coinbase.com/agentic-wallet/mcp/welcome). Then connect HyperNatt Terminal (`https://hypernatt.com/mcp/protocol`). Your agent can pay `get_liq_radar` ($0.001) automatically when it sees HTTP 402.

Optional heavy use (not required): swap-earned quota or $5/mo Agent Pass — see live `pass_program` / `quota_program` on the manifest.

## License

MIT — see [LICENSE](LICENSE).

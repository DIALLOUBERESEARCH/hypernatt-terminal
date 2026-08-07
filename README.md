# HyperNatt Terminal

[![Live](https://img.shields.io/badge/Live-hypernatt.com-00c853)](https://hypernatt.com)
[![CI](https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/actions/workflows/ci.yml/badge.svg)](https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/actions/workflows/ci.yml)
[![MCP](https://img.shields.io/badge/MCP-3%20tools%20·%20v2.7.0-9c27b0)](https://hypernatt.com/mcp/protocol)
[![x402](https://img.shields.io/badge/x402-Base%20%2B%20Solana-blue)](https://hypernatt.com/.well-known/x402)
[![Security](https://img.shields.io/badge/Security-no%20custody%20·%20verify-brightgreen)](./SECURITY.md)
[![Seller skill](https://img.shields.io/badge/x402%20seller-security%20skill-orange)](https://github.com/DIALLOUBE-RESEARCH/solana-x402-seller-security-skill)
[![Glama](https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal/badges/score.svg)](https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal)
[![x402-list](https://x402-list.com/badge/hypernatt-terminal.svg?data=uptime)](https://x402-list.com/services/hypernatt-terminal?utm_source=badge&utm_medium=referral&utm_campaign=embed)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](./LICENSE)
[![npm audit](https://img.shields.io/badge/npm%20audit-0%20high-brightgreen)](./CHANGELOG.md)

**Agent MCP:** multi-crypto **liquidation radar** + **Li.Fi** cross-chain swap. Read-only microstructure context from a live Hyperliquid vault operator — **not** trade advice, **no** custody.

Full HyperNatt platform: https://hypernatt.com — this repo is one agent-facing brick.

> **Public mirror note:** synced from the NATTAPP monorepo (`backend/services/m2m/mcp/public-repo/`). History here is mirror commits, not the private monorepo timeline.

## What it does

| Tool | Role | Price |
|------|------|-------|
| `get_agent_manifest` | Catalog + journeys — **call first** | Free |
| `get_liq_radar` | Liq / OI / cluster context (whitelist) | **$0.001** x402 (Base + Solana) |
| `swap_via_nattswap` | Li.Fi route + actions — **you** sign | Free at MCP (gas + Li.Fi fee on-chain) |

Whitelist `get_liq_radar`: **BTC ETH SOL BNB XRP HYPE ZEC** (omit `symbol` = BTC).

Heavy use: swap-earned quota or **$5/mo** Agent Pass (~15,000 credits).

### What we do NOT claim

| We do **not** claim | What we **do** show |
|---------------------|---------------------|
| Generic Coinglass / market-data wrapper | Operator-shaped liq radar for agents |
| Custody of keys or funds | Agent signs own txs; server never broadcasts |
| Trade advice / guaranteed edge | Read-only JSON context + interpretation bounds |
| 9 or 15 MCP tools | **Exactly 3 tools** · v2.7.0 |
| Vault / `/stats` page = Terminal MCP P&L | Separate HyperNatt vault product — not this MCP |
| Independent security audit / bank-grade | Public code + [SECURITY.md](./SECURITY.md) + [x402 seller skill](https://github.com/DIALLOUBE-RESEARCH/solana-x402-seller-security-skill) |

## Start here

| Step | Link |
|------|------|
| **1. Free catalog (30s)** | `curl -s https://hypernatt.com/api/m2m/agent/manifest` |
| **2. Quickstart** | [docs/quickstart.md](docs/quickstart.md) |
| **3. Examples** | [examples/](examples/) — `liq_radar_min.py` then `swap_after_liq_radar.py` |
| **4. Tool reference** | [tools/README.md](tools/README.md) |
| **5. Security (buyer trust)** | [SECURITY.md](SECURITY.md) |
| **6. Buyer skill (agents)** | [skills/hypernatt-terminal/SKILL.md](skills/hypernatt-terminal/SKILL.md) |
| **7. Seller hardening (builders)** | [solana-x402-seller-security-skill](https://github.com/DIALLOUBE-RESEARCH/solana-x402-seller-security-skill) |
| **8. Integrations** | [docs/integrations.md](docs/integrations.md) |
| **9. Changelog** | [CHANGELOG.md](CHANGELOG.md) |
| **10. Tests** | [test/](test/) — `npm test` (node:test) |

MCP endpoint: https://hypernatt.com/mcp/protocol

## Security

- **No custody** — Decision Core reads are data; swap returns Li.Fi instructions for **your** agent to evaluate and sign.
- **x402 you control** — pay per call; no static API keys required for the free manifest.
- **Seller defenses** — same multi-rail (Base + Solana) stack documented in the open [x402 seller security skill](https://github.com/DIALLOUBE-RESEARCH/solana-x402-seller-security-skill) (Security Invariants + heuristic checker). That skill is **not** a substitute for an independent audit.

Verify yourself: [SECURITY.md](SECURITY.md) · source · `curl -i https://hypernatt.com/api/m2m/liq-radar` (real **402**).

## License

MIT — see [LICENSE](LICENSE).

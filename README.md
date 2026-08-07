# HyperNatt Terminal

[![CI](https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/actions/workflows/ci.yml/badge.svg)](https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/actions/workflows/ci.yml)
[![Glama](https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal/badges/score.svg)](https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal)
[![x402-list](https://x402-list.com/badge/hypernatt-terminal.svg?data=uptime)](https://x402-list.com/services/hypernatt-terminal?utm_source=badge&utm_medium=referral&utm_campaign=embed)
[![Version](https://img.shields.io/badge/version-2.7.0-green)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](./LICENSE)
[![npm audit](https://img.shields.io/badge/npm%20audit-0%20high-brightgreen)](./CHANGELOG.md)

Multi-crypto **liquidation radar** for AI agents + **Li.Fi** cross-chain swap. Pay-per-call via x402.

Built by one person. Code is public. Backend is private. No custody. Not trade advice.

Full HyperNatt platform (vault, assistant): https://hypernatt.com — this repo is one agent-facing brick.

> Public mirror synced from a private monorepo. History here is mirror commits.

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
| Generic Coinglass wrapper | Operator-shaped liq radar for agents |
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
| Examples | [examples/](examples/) |
| Security | [SECURITY.md](SECURITY.md) |
| Buyer skill (use the MCP) | [skills/hypernatt-terminal/SKILL.md](skills/hypernatt-terminal/SKILL.md) |
| Seller skill (x402 hardening) | [solana-x402-seller-security-skill](https://github.com/DIALLOUBE-RESEARCH/solana-x402-seller-security-skill) |
| Tests | [test/](test/) — `npm test` |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |

MCP: https://hypernatt.com/mcp/protocol

Optional heavy use (not required): swap-earned quota or $5/mo Agent Pass — see live `pass_program` / `quota_program` on the manifest.

## License

MIT — see [LICENSE](LICENSE).

---
name: hypernatt-terminal
description: >-
  Connect HyperNatt Terminal MCP — multi-crypto liquidation radar
  (BTC ETH SOL BNB XRP HYPE ZEC) + Li.Fi swap. Free get_agent_manifest;
  get_liq_radar at $0.001 USDC via x402 (Base + Solana). Not trade advice. No custody.
version: 1.1.0
author: DIALLOUBE-RESEARCH
license: MIT
metadata:
  hermes:
    tags: [MCP, x402, BTC, crypto, hyperliquid, liquidation-radar, market-microstructure]
    related_skills: [native-mcp, mcporter]
---

# HyperNatt Terminal MCP

Production MCP seller for AI agents.

| Resource | URL |
|----------|-----|
| Platform | https://hypernatt.com |
| MCP (streamable-http) | https://hypernatt.com/mcp/protocol |
| Server card | https://hypernatt.com/.well-known/mcp/server-card.json |
| Source | https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal |
| Security | https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/blob/main/SECURITY.md |

**Version:** 3 tools · v2.7.0 · Streamable HTTP.

HyperNatt is the live trading + AI platform. **hypernatt-terminal** is one agent-facing brick — not the whole product.

---

## When to use

Load this skill when the agent needs **liquidation / OI / cluster context** on whitelist coins, or a **Li.Fi cross-chain swap** route:

- Liquidation radar (`get_liq_radar`) — optional `symbol` (default BTC)
- Catalog / prices (`get_agent_manifest`) — free, call first
- Cross-chain swap (`swap_via_nattswap`) — agent signs own tx

**Do not use** for generic price feeds, vault deposits, or custody.

---

## Tool surface (3 tools)

| Tool | Credits | Role |
|------|---------|------|
| `get_agent_manifest` | Free | Catalog + journeys |
| `get_liq_radar` | 1 ($0.001 x402) | Multi-crypto liq radar |
| `swap_via_nattswap` | Free (MCP) | Li.Fi route + actions |

Whitelist: **BTC ETH SOL BNB XRP HYPE ZEC** (omit symbol = BTC).

---

## Suggested flow

1. `get_agent_manifest`
2. `get_liq_radar` (optional `symbol`)
3. Optional: `swap_via_nattswap` when the agent needs to move funds

---
name: hypernatt-liq-radar
description: >-
  Instructs the agent to call the remote HyperNatt MCP tool get_liq_radar
  (forced-order / liquidation map) before sizing a crypto perp. Exactly 3 MCP
  tools exist on the server (v2.7.0). This skill is documentation + call order
  only — no local executables, no shell, no file writes. Read-only context.
  Not trade advice. Paid get_liq_radar = $0.001 USDC via x402.
version: 1.0.1
author: DIALLOUBE-RESEARCH
license: MIT
homepage: https://hypernatt.com
permissions:
  exec: false
  filesystem: false
  network:
    - hypernatt.com
    - docs.cdp.coinbase.com
  env: []
  tools:
    - mcp
metadata:
  openclaw:
    requires:
      bins: []
    envVars: []
  hermes:
    tags:
      [
        trading,
        hyperliquid,
        perpetual,
        liquidation,
        microstructure,
        x402,
        MCP,
      ]
    related_skills: [native-mcp, mcporter, hypernatt-terminal]
---

# HyperNatt Liq Radar — trading-agent skill

**What this skill is:** text instructions so an OpenClaw/Hermes agent knows
**when and how** to call a **remote** MCP server.

**What this skill is NOT:** a local trading bot, shell scripts, or 14 tools.
The live MCP surface is **exactly 3 tools · v2.7.0**.

## Declared capabilities (honest)

| Capability | Declared |
|------------|----------|
| Local exec / shell | **No** |
| Local filesystem | **No** |
| Env vars required | **None** |
| Outbound network | `https://hypernatt.com` (MCP + docs) ; optional Coinbase payments docs |
| Tools | Remote MCP only — agent runtime must already support MCP connectors |

## Remote MCP (single host)

| Resource | URL |
|----------|-----|
| MCP | `https://hypernatt.com/mcp/protocol` |
| Server card | `https://hypernatt.com/.well-known/mcp/server-card.json` |
| Source | https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal |
| Security | https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/blob/main/SECURITY.md |

## Live tool surface (3 only)

| Tool | Cost | Role |
|------|------|------|
| `get_agent_manifest` | Free | Catalog |
| `get_liq_radar` | $0.001 USDC x402 | Forced-order / liquidation map |
| `swap_via_nattswap` | Free at MCP (you sign on-chain) | Li.Fi route |

Whitelist symbols for `get_liq_radar`: BTC ETH SOL BNB XRP HYPE ZEC (omit = BTC).

## When to use

Before sizing or entering a **perp**, if the user asks to trade better / check
liquidations / Hyperliquid microstructure.

## Loop

1. Ensure MCP connector URL above is configured in the agent runtime.
2. `get_agent_manifest` (free) once per session if needed.
3. `get_liq_radar` with optional `symbol`.
4. Interpret distances / OI / clusters structurally — **do not invent signals**.
5. Execute trades via a **separate** venue skill (Hyperliquid / CEX). This skill
   does not place orders.
6. Optional `swap_via_nattswap` only to bridge/fund — agent signs.

## Payment (x402)

`get_liq_radar` returns HTTP 402 without payment. The **agent wallet / MCP
payment client** (e.g. Coinbase payments-mcp) settles USDC — this skill does
not hold keys and does not harvest env secrets.

## Honest claims

- Not trade advice · no custody · no performance promise
- Vault P&L on hypernatt.com is **not** this MCP's track record
- Do not claim more than 3 tools

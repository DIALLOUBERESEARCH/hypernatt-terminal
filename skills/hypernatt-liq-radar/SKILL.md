---
name: hypernatt-liq-radar
description: >-
  Instructs the agent to call the remote HyperNatt MCP tool get_liq_radar
  (forced-order / liquidation map) before sizing any crypto perp - BTC ETH SOL
  and other whitelist assets, any venue. Exactly 3 MCP tools (v2.7.0). Docs +
  call order only - no local exec/shell/files. Read-only. Not trade advice.
  get_liq_radar = $0.001 USDC via x402.
version: 1.0.3
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
        crypto,
        perpetual,
        liquidation,
        microstructure,
        market-data,
        x402,
        MCP,
        swap,
      ]
    related_skills: [native-mcp, mcporter, hypernatt-terminal]
---

# HyperNatt Liq Radar - trading-agent skill

**What this skill is:** text instructions so an OpenClaw/Hermes agent knows
**when and how** to call a **remote** MCP server.

**What this skill is NOT:** a local trading bot, shell scripts, or 14 tools.
The live MCP surface is **exactly 3 tools | v2.7.0**.

## Declared capabilities (honest)

| Capability | Declared |
|------------|----------|
| Local exec / shell | **No** |
| Local filesystem | **No** |
| Env vars required | **None** |
| Outbound network | `https://hypernatt.com` (MCP + docs) ; optional Coinbase payments docs |
| Tools | Remote MCP only - agent runtime must already support MCP connectors |

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
liquidations / market microstructure (any venue).

## Example

```bash
# Free catalog check
curl -s https://hypernatt.com/api/m2m/agent/manifest | head

# Paid tool (via MCP runtime + x402 wallet) - pseudo:
# tools/call get_liq_radar  {"symbol":"ETH"}
```

## Loop

1. Ensure MCP connector URL above is configured in the agent runtime.
2. `get_agent_manifest` (free) once per session if needed.
3. `get_liq_radar` with optional `symbol`.
4. Interpret distances / OI / clusters structurally - **do not invent signals**.
5. Execute trades via a **separate** venue skill (CEX / DEX / perps). This skill
   does not place orders.
6. Optional `swap_via_nattswap` only to bridge/fund - agent signs.

## Payment (x402)

`get_liq_radar` returns HTTP 402 without payment. The **agent wallet / MCP
payment client** (e.g. Coinbase payments-mcp) settles USDC - this skill does
not hold keys and does not harvest env secrets.

## Honest claims

- Not trade advice | no custody | no performance promise
- Vault P&L on hypernatt.com is **not** this MCP's track record
- Do not claim more than 3 tools

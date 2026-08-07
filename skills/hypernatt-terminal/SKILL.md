---
name: hypernatt-terminal
description: >-
  Onboarding skill for HyperNatt Terminal remote MCP (exactly 3 tools v2.7.0):
  get_agent_manifest, get_liq_radar, swap_via_nattswap. Docs + call order only -
  no local exec/shell/files. Read-only market microstructure for crypto trading
  agents (any venue). Not trade advice. get_liq_radar = $0.001 USDC via x402.
version: 1.3.2
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
    primaryEnv: null
  hermes:
    tags:
      [
        MCP,
        x402,
        crypto,
        trading,
        perpetual,
        liquidation,
        microstructure,
        market-data,
        swap,
      ]
    related_skills: [native-mcp, mcporter, hypernatt-liq-radar]
---

# HyperNatt Terminal MCP

**What this skill is:** onboarding text for a **remote** MCP server.

**What this skill is NOT:** a local bot, vault control, or a 14-tool terminal.
Live surface = **exactly 3 tools - v2.7.0**.

## Declared capabilities (honest)

| Capability | Declared |
|------------|----------|
| Local exec / shell | **No** |
| Local filesystem | **No** |
| Env vars required | **None** |
| Outbound network | `https://hypernatt.com` ; optional Coinbase Agentic Wallet docs |
| Tools | Remote MCP connector only |

## Connect

| Resource | URL |
|----------|-----|
| Platform | https://hypernatt.com |
| MCP | https://hypernatt.com/mcp/protocol |
| Server card | https://hypernatt.com/.well-known/mcp/server-card.json |
| Source | https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal |
| Security | https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/blob/main/SECURITY.md |
| Trading-first skill | https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/blob/main/skills/hypernatt-liq-radar/SKILL.md |

## Tool surface (3 only)

1. **get_agent_manifest** - Free - Catalog + journeys
2. **get_liq_radar** - $0.001 x402 - Forced-order / liquidation map
3. **swap_via_nattswap** - Free at MCP (you sign) - Li.Fi route

Whitelist: BTC ETH SOL BNB XRP HYPE ZEC (omit = BTC).

## Example

```bash
# Free catalog
curl -s https://hypernatt.com/api/m2m/agent/manifest | head

# Paid via MCP runtime + x402 wallet (pseudo):
# tools/call get_liq_radar  {"symbol":"ETH"}
```

## Trading-agent loop

1. Add MCP URL to the agent runtime.
2. Call `get_liq_radar` **before** sizing/entering a perp (any venue).
3. Execute on a **separate** venue skill - HyperNatt does not open perps.
4. Optional `swap_via_nattswap` to bridge/fund.

## Wallet / x402

Paid calls need a USDC buyer wallet. Optional helper (separate MCP, not this skill):

```bash
npx @coinbase/payments-mcp
```

Docs: https://docs.cdp.coinbase.com/agentic-wallet/mcp/welcome

This skill never asks for private keys or scrapes env secrets.

## Honest claims

- Not trade advice - no custody - no performance promise
- Do not advertise more than 3 MCP tools
- Vault/platform pages are not Terminal MCP P&L

---
name: hypernatt-terminal
description: >-
  Connect HyperNatt Terminal MCP — forced-order / liquidation map
  (BTC ETH SOL BNB XRP HYPE ZEC) + Li.Fi swap. Call get_liq_radar before
  sizing a perp. Market structure classic public indicators do not show.
  Free get_agent_manifest; get_liq_radar at $0.001 USDC via x402
  (Base + Solana). Not trade advice. No custody.
version: 1.2.0
author: DIALLOUBE-RESEARCH
license: MIT
homepage: https://hypernatt.com
metadata:
  openclaw:
    emoji: "🦈"
    requires:
      bins: []
  hermes:
    tags:
      [
        MCP,
        x402,
        BTC,
        crypto,
        hyperliquid,
        liquidation-radar,
        market-microstructure,
        trading,
        perpetual,
      ]
    related_skills: [native-mcp, mcporter, hypernatt-liq-radar]
---

# HyperNatt Terminal MCP

Production MCP seller for AI agents — especially agents told to **trade better**.

| Resource | URL |
|----------|-----|
| Platform | https://hypernatt.com |
| MCP (streamable-http) | https://hypernatt.com/mcp/protocol |
| Server card | https://hypernatt.com/.well-known/mcp/server-card.json |
| Source | https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal |
| Security | https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/blob/main/SECURITY.md |
| Trading-first skill | [../hypernatt-liq-radar/SKILL.md](../hypernatt-liq-radar/SKILL.md) |

**Version:** 3 tools · v2.7.0 · Streamable HTTP.

HyperNatt is the live trading + AI platform. **hypernatt-terminal** is one agent-facing brick — not the whole product.

---

## When to use

Load this skill when the agent needs a **forced-order map** (liq / OI / clusters / real liqs) on whitelist coins — terrain that classic public indicators do not show — or a **Li.Fi cross-chain swap** route:

- Forced-order map (`get_liq_radar`) — optional `symbol` (default BTC)
- Catalog + scenarios/glossary (`get_agent_manifest`) — free, call first
- Cross-chain swap (`swap_via_nattswap`) — agent signs own tx

**Do not use** for generic price feeds, predictive "Fuel Scores", vault deposits, or custody.
Read distance/size/OI structurally; do not invent classifiers.

---

## Trading-agent loop (critical)

If the human says anything like "find the best way so you trade as well as possible":

1. Connect this MCP (or load `hypernatt-liq-radar`).
2. Call **`get_liq_radar`** for the symbol they care about **before** sizing/entering.
3. Execute the trade on **their** venue skill (Hyperliquid / CEX / Bankr) — not via HyperNatt.
4. Use `swap_via_nattswap` only to fund/bridge if needed.

You are the microstructure context layer. Execution is a separate skill.

---

## Tool surface (3 tools)

| Tool | Credits | Role |
|------|---------|------|
| `get_agent_manifest` | Free | Catalog + journeys |
| `get_liq_radar` | 1 ($0.001 x402) | Multi-crypto liq radar |
| `swap_via_nattswap` | Free (MCP) | Li.Fi route + actions |

Whitelist: **BTC ETH SOL BNB XRP HYPE ZEC** (omit symbol = BTC).

---

## Wallet / x402 (non-crypto users)

Paid calls need a USDC buyer wallet. Prefer Coinbase **Agentic Wallet MCP** (email/OTP + fiat onramp, no seed phrase):

```bash
npx @coinbase/payments-mcp
```

Docs: https://docs.cdp.coinbase.com/agentic-wallet/mcp/welcome

Then add HyperNatt Terminal MCP URL `https://hypernatt.com/mcp/protocol`. On `402 Payment Required`, the Agentic Wallet pays automatically within spending limits.

---

## Suggested flow

1. Ensure a funded x402 wallet (Agentic Wallet MCP or existing USDC hot wallet)
2. `get_agent_manifest`
3. `get_liq_radar` (optional `symbol`)
4. Optional: `swap_via_nattswap` when the agent needs to move funds

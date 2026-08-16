# HyperNatt Terminal — Agent Quickstart

**Platform:** [https://hypernatt.com](https://hypernatt.com) — full HyperNatt product. **This doc** covers the **hypernatt-terminal** MCP brick only (`/mcp/protocol`).

**30-second Claude Connectors block** (Name / URL table): see [../README.md](../README.md#quick-start-30-seconds).

**Humans (Claude / Cursor):** add connector `https://hypernatt.com/mcp/protocol`, then ask:

> Call get_agent_manifest, then get_liq_radar. If cluster_grammar is present, read it before liq_radar. class=noise (<3%) is high-leverage bait — ignore. class=true (~7%+) is the low-leverage stack. Terrain, not a signal.

**Agents:** 3 tools · v2.7.0. **Smithery:** https://smithery.ai/servers/hypernatt/hypernatt-terminal

**HL agent (read terrain only):** [../examples/hyperliquid/read_terrain.py](../examples/hyperliquid/read_terrain.py) · sovereignty: [agent-hl-sovereignty.md](agent-hl-sovereignty.md)

**Why this exists:** classic public indicators do not show where leveraged liquidations stack. `get_liq_radar` is that terrain map — context for timing/sizing/risk, **not** a trade signal.

### Wallet first (if you are not crypto-native)

`get_liq_radar` returns HTTP **402** until paid in USDC. Skip seed phrases — use Coinbase Agentic Wallet:

```bash
npx @coinbase/payments-mcp
```

Then fund with card / Apple Pay / Google Pay and connect Terminal. Guide: https://docs.cdp.coinbase.com/agentic-wallet/mcp/welcome

---

## Star path (F#99N)

1. **`get_agent_manifest`** (free) — catalog + `agent_interpretation_rules_v1` (value prop, scenarios, glossary)
2. **`get_liq_radar`** ($0.001) — optional `symbol` among BTC ETH SOL BNB XRP HYPE ZEC (omit = BTC)
3. Optional **`swap_via_nattswap`** — Li.Fi route; you sign

Honest field walkthrough: [../examples/liq_radar_interpret.py](../examples/liq_radar_interpret.py)

Example `get_liq_radar` shape:

```json
{
  "ok": true,
  "product": "hypernatt_liq_radar_v2",
  "symbol": "ETH",
  "binance_symbol": "ETHUSDT",
  "provenance": { "venue": "binance_oi_hist+hyperliquid_ctx" },
  "liq_radar": { "available": true }
}
```

---

## Connect

| Client | Endpoint |
|--------|----------|
| Streamable HTTP | `https://hypernatt.com/mcp/protocol` |
| Server card | `https://hypernatt.com/.well-known/mcp/server-card.json` |
| REST catalog | `GET https://hypernatt.com/api/m2m/agent/manifest` |

Tool docs: [../tools/](../tools/)

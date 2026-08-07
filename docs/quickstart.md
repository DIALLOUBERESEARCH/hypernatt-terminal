# HyperNatt Terminal — Agent Quickstart

**Platform:** [https://hypernatt.com](https://hypernatt.com) — full HyperNatt product. **This doc** covers the **hypernatt-terminal** MCP brick only (`/mcp/protocol`).

**Humans (Claude / Cursor):** add connector `https://hypernatt.com/mcp/protocol`, then ask:

> *Call get_agent_manifest, then get_liq_radar — what is the liq context?*

**Agents:** 3 tools · v2.7.0. **Smithery:** https://smithery.ai/servers/hypernatt/hypernatt-terminal

---

## Star path (F#99N)

1. **`get_agent_manifest`** (free) — catalog
2. **`get_liq_radar`** ($0.001) — optional `symbol` among BTC ETH SOL BNB XRP HYPE ZEC (omit = BTC)
3. Optional **`swap_via_nattswap`** — Li.Fi route; you sign

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

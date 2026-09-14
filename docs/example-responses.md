# Example responses (production)

Execution tools: `get_execution_quote`, `compare_execution_context`, `reconcile_execution` (0.001 USDC each). [Workflow](execution-context.md).
Canonical MCP surface: **6 tools** (`get_agent_manifest`, `get_liq_radar`,
`swap_via_nattswap`). Values refresh every call — structure is stable.

---

## `get_liq_radar` — liquidation radar

**1 credit** · symbols: BTC ETH SOL BNB XRP HYPE ZEC (omit = BTC)

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

**Read it:** multi-crypto liq / OI / cluster snapshot. Read-only market context —
not a trade signal. Clusters expose `largest_*_cluster` within ±10% of mark.

---

## Try it

```bash
curl -sS "https://hypernatt.com/api/m2m/liq-radar?symbol=ETH"
```

MCP: `https://hypernatt.com/mcp/protocol` — tool `get_liq_radar`.

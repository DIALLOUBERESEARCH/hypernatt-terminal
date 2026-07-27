# Agent Trading Hub (`get_trading_hub`)

One-stop BTC decision context for agents: **TA + orderflow + liquidation clusters (above and below) + hunt + regime** in a single MCP call.

## Journey (agent chooses cadence)

1. `get_agent_manifest` (free)
2. `get_trading_hub` — refresh **when you need it** (no mandatory poll interval)
3. Zoom if needed: `get_ta_snapshot` | `get_orderflow` | `get_liq_radar` | `get_mm_trap_state` | `get_ignition` | `get_entry_quality`
4. Execute on **your** venue (Hyperliquid / CEX) — HyperNatt never places orders

## Why not poll?

Forced “poll every N minutes” copy pushed sticky agents away. **You** decide when context is stale. Call again after a move, before sizing, or on your own schedule.

## Cost

`$0.001` flat via x402 (Base or Solana), same Decision Core pack. Intro-free first call per tool/day when enabled. HOLD on `get_btc_usdc_signal` remains free.

## Schemas

| Tool | Schema |
|------|--------|
| `get_trading_hub` | `hypernatt_trading_hub_v1` |
| `get_ta_snapshot` | `hypernatt_ta_snapshot_v1` |
| `get_orderflow` | `hypernatt_orderflow_v1` |
| `get_regime` | `hypernatt_regime_v1` |
| `get_ignition` | `hypernatt_ignition_v1` |
| `get_entry_quality` | `hypernatt_entry_quality_v1` |

`liq` in the hub always exposes `clusters_above` and `clusters_below` (arrays, possibly empty).

## Kill switch

`F58N_TRADING_HUB_ENABLED=false` on m2m-service (then recreate m2m + mcp).

## Related

- Optional deep dive: [agent-liq-radar-loop.md](agent-liq-radar-loop.md) (no forced poll)
- HL sovereignty: [agent-hl-sovereignty.md](agent-hl-sovereignty.md)

# Example responses (production)

Real shapes returned by Decision Core tools. Values refresh on every call — structure is stable.

Captured from `https://hypernatt.com` on **2026-06-13** (free tier / MCP session).

---

## `get_btc_usdc_signal` — vault cycle now

**1 credit** · **HOLD = free**

```json
{
  "ok": true,
  "product": "hypernatt_mimo_cycle_state_v1",
  "pair": "BTC/USDC",
  "timeframe": "15m",
  "issued_at": "2026-06-13T13:34:52.031Z",
  "vault_wallet_redacted": "0x04e2…a6d8",
  "has_active": true,
  "cycle": {
    "cycle_id": "C94D4BB60",
    "direction": "LONG",
    "total_legs": 4,
    "avg_entry_price": 66715.06,
    "started_at": "2026-06-01T00:45:14.502990+00:00",
    "market_at_entry": {
      "movement": { "price": 73946.65, "velocity_15m": 0.36 },
      "consensus": {
        "direction": "BULLISH",
        "bullish_score": 45,
        "bearish_score": 0
      }
    }
  },
  "disclaimer": "Live verifiable Mimo cycle state only. Not a trade recommendation."
}
```

**How to read it:** `direction` = active vault bias (**LONG** / **SHORT** / **HOLD**). `cycle_id` + `total_legs` = live DLA state on Hyperliquid. Cross-check: [hypernatt.com/stats](https://hypernatt.com/stats) · [vault](https://app.hyperliquid.xyz/vaults/0x04e2eb302fe9ff23a9d1f2455084af624737a6d8).

Full payload includes per-leg entries and richer `market_at_entry` blocks.

---

## `get_mm_hunt_score` — MM pressure & hunt context

**1 credit**

```json
{
  "product": "hypernatt_mm_hunt_score_v1",
  "pair": "BTC/USDC",
  "issued_at": "2026-06-13T13:34:53.117Z",
  "data_available": true,
  "mm_hunt_score": -35,
  "magnet_bias": "BEARISH_MAGNET",
  "pressure_direction": "DOWN_HUNT_LONGS",
  "alert_level": "orange",
  "long_trap_phase": {
    "phase": 4,
    "label": "DISTRIBUTION INSTITUTIONNELLE",
    "next_trigger": "HLP SHORT + Funding > 0"
  },
  "interpretation_en": "Magnet score -35 (BEARISH_MAGNET): price pressure favors long liquidation hunt downward. Long-trap phase 4 …",
  "inputs": {
    "oi": { "delta_48h_pct": -2.86, "building": false },
    "ls_ratio": { "long_pct": 59.9, "short_pct": 40.1 },
    "hlp_vault": { "size_btc": 0.23, "side": "LONG" }
  },
  "disclaimer": "Read-only BTC perp microstructure context. Not a trade signal."
}
```

**How to read it:** negative `mm_hunt_score` + `BEARISH_MAGNET` = downward liquidation hunt pressure on crowded longs. Pair with `get_liq_radar` (2 credits) for cluster detail.

---

## Try it yourself (no wallet)

```bash
# MCP — after initialize session
# tools/call → get_btc_usdc_signal

# REST (free tier may return 200 without payment)
curl -sS https://hypernatt.com/api/m2m/signal | jq '.cycle.direction, .cycle.cycle_id'
curl -sS https://hypernatt.com/api/m2m/mm-hunt | jq '.mm_hunt_score, .magnet_bias, .pressure_direction'
```

MCP endpoint: `https://hypernatt.com/mcp/protocol`

# Example responses (production)

Real shapes from Decision Core. Values refresh every call — structure is stable.

Captured from `https://hypernatt.com` on **2026-06-13**.

**Order:** trap (MM edge) → signal (live vault) → hunt (1-line summary).

---

## 1. `get_mm_trap_state` — MM trap / sweep / reclaim

**2 credits** · not Coinglass commodity

```json
{
  "product": "hypernatt_mm_trap_state_v1",
  "state": "MM_TRAP_ACTIVE",
  "trap_direction": "DOWN_HUNT_LONGS",
  "cluster_price": 57800,
  "cycles_since_trap": 6,
  "sweep_zone": { "low": 56933, "high": 58667 },
  "chart_verdicts": {
    "hunt": "SWEEP_MATH_FAIL",
    "reclaim": "RECLAIM_MATH_OK"
  },
  "disclaimer": "MM manipulation weather. Read-only, not financial advice."
}
```

**Read it:** MM is actively hunting longs downward. Sweep math failed but reclaim math OK — know *where* the trap sits before you size.

---

## 2. `get_btc_usdc_signal` — live vault cycle

**1 credit** · **HOLD = free**

```json
{
  "ok": true,
  "pair": "BTC/USDC",
  "issued_at": "2026-06-13T13:42:22.315Z",
  "vault_wallet_redacted": "0x04e2…a6d8",
  "has_active": true,
  "cycle": {
    "cycle_id": "C94D4BB60",
    "direction": "LONG",
    "total_legs": 4,
    "avg_entry_price": 66715.06
  },
  "disclaimer": "Live verifiable Mimo cycle state only. Not a trade recommendation."
}
```

**Read it:** what the **live Hyperliquid vault** is doing right now. Verify: [stats](https://hypernatt.com/stats) · [vault](https://app.hyperliquid.xyz/vaults/0x04e2eb302fe9ff23a9d1f2455084af624737a6d8).

---

## 3. `get_mm_hunt_score` — pressure summary

**1 credit**

```json
{
  "product": "hypernatt_mm_hunt_score_v1",
  "pair": "BTC/USDC",
  "mm_hunt_score": -35,
  "magnet_bias": "BEARISH_MAGNET",
  "pressure_direction": "DOWN_HUNT_LONGS",
  "alert_level": "orange",
  "long_trap_phase": {
    "phase": 4,
    "label": "DISTRIBUTION INSTITUTIONNELLE"
  },
  "interpretation_en": "Magnet score -35: price pressure favors long liquidation hunt downward…"
}
```

**Read it:** compressed hunt narrative when you want one screen, not the full trap payload.

---

## Try it (no wallet on free tier)

```bash
curl -sS https://hypernatt.com/api/m2m/mm-trap-state | jq '.state, .trap_direction, .sweep_zone'
curl -sS https://hypernatt.com/api/m2m/signal | jq '.cycle.direction, .cycle.cycle_id, .cycle.total_legs'
curl -sS https://hypernatt.com/api/m2m/mm-hunt | jq '.mm_hunt_score, .magnet_bias, .pressure_direction'
```

MCP: `https://hypernatt.com/mcp/protocol` — tools `get_mm_trap_state`, `get_btc_usdc_signal`, `get_mm_hunt_score`.

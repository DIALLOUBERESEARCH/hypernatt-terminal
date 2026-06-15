# `get_mm_hunt_score`

BTC perp **microstructure pressure** — hunt score, magnet bias, long-trap phase, and a one-paragraph interpretation.

Answers: *Which way is liquidation pressure leaning? What phase is the long trap in?*

Compressed view of the same upstream block as `get_liq_radar` — use when you want **narrative**, not raw clusters.

## Price

| Tier | Cost |
|------|------|
| **Credits** | **1** (shared daily pool) |
| **Free tier** | 25 shared pool/day + 1st call free per tool (~32 effective/day) |
| **Paygo** | **$0.01 USDC** / credit via **x402** on **Base** (`eip155:8453`) |

## When to use

| Situation | Call |
|-----------|------|
| Quick hunt read / alert level | `get_mm_hunt_score` |
| Trap zones + sweep/reclaim math | `get_mm_trap_state` (hero) |
| Raw clusters + OI density | `get_liq_radar` |
| Live vault direction | `get_btc_usdc_signal` |

**Suggested stack:** trap → signal → **hunt**.

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x_payment` | string | No* | Base64 x402 payment payload. Omit first to get payment instructions. |
| `agent_wallet` | string | No | Wallet with quota balance (bypass x402 when covered). |

## Example response (production)

```json
{
  "product": "hypernatt_mm_hunt_score_v1",
  "symbol": "BTCUSDT",
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
  "disclaimer": "Read-only BTC perp microstructure context for agent workflows. Not a trade signal."
}
```

## Field guide

| Field | Meaning |
|-------|---------|
| `mm_hunt_score` | -100..+100 magnet-style pressure (F#21) |
| `magnet_bias` | e.g. `BEARISH_MAGNET` / `BULLISH_MAGNET` |
| `pressure_direction` | e.g. `DOWN_HUNT_LONGS` |
| `alert_level` | Severity band (e.g. orange) |
| `long_trap_phase` | MM trap phase label + triggers |
| `interpretation_en` | Human/agent-readable summary |

## Try it

```bash
curl -sS https://hypernatt.com/api/m2m/mm-hunt \
  | jq '.mm_hunt_score, .magnet_bias, .pressure_direction, .alert_level'
```

MCP: `tools/call` → `get_mm_hunt_score` on `https://hypernatt.com/mcp/protocol`

HTTP mirror: `GET https://hypernatt.com/api/m2m/mm-hunt`

More examples: [../docs/example-responses.md](../docs/example-responses.md)

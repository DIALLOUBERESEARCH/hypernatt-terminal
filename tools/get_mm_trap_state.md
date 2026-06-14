# `get_mm_trap_state`

Live BTC **market-maker trap state** — the flagship Decision Core read for pro workflows.

Answers: *Is the MM trapping right now? Which side? Where is the sweep zone? Do sweep/reclaim verdicts hold mathematically?*

Not a Coinglass cluster dump — **manipulation weather** with redacted detector internals.

## Price

| Tier | Cost |
|------|------|
| **Credits** | **2** (shared daily pool) |
| **Free tier** | 25 shared pool/day + 1st call free per tool (~32 effective/day) |
| **Paygo** | **$0.01 USDC** / credit via **x402** on **Base** (`eip155:8453`) |

Paywall order: free tier → swap quotas → Agent Pass → Pro Pass → x402.

## When to use

| Situation | Call |
|-----------|------|
| Before sizing into a crowded side | `get_mm_trap_state` |
| Need raw clusters / OI blocks | `get_liq_radar` (commodity layer) |
| One-line hunt summary | `get_mm_hunt_score` |
| What the live vault is doing | `get_btc_usdc_signal` |

**Suggested stack:** trap → signal → hunt.

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x_payment` | string | No* | Base64 x402 payment payload. Omit first to get payment instructions. |
| `agent_wallet` | string | No | Wallet with swap-earned quota balance (bypass x402 when covered). |

\* MCP session may consume **free tier** credits without wallet.

## Example response (production)

```json
{
  "product": "hypernatt_mm_trap_state_v1",
  "symbol": "BTC",
  "issued_at": "2026-06-13T13:42:19.994Z",
  "ok": true,
  "available": true,
  "state": "MM_TRAP_ACTIVE",
  "trap_direction": "DOWN_HUNT_LONGS",
  "cluster_price": 57800,
  "cycles_since_trap": 6,
  "had_sweep_this_trap": false,
  "sweep_zone": { "low": 56933, "high": 58667 },
  "chart_verdicts": {
    "hunt": "SWEEP_MATH_FAIL",
    "local": "SWEEP_MATH_N/A",
    "reclaim": "RECLAIM_MATH_OK"
  },
  "disclaimer": "MM manipulation weather (trap/sweep/reclaim zones). Read-only observation, not financial advice."
}
```

## Field guide

| Field | Meaning |
|-------|---------|
| `state` | `MM_TRAP_ACTIVE` / idle variants — trap latch on or off |
| `trap_direction` | e.g. `DOWN_HUNT_LONGS` — who the MM is hunting |
| `cluster_price` | Latched liquidation cluster reference |
| `sweep_zone` | Price band where sweep math is evaluated |
| `chart_verdicts.hunt` | Sweep math pass/fail on hunt chart |
| `chart_verdicts.reclaim` | Reclaim math pass/fail |
| `cycles_since_trap` | Cycles since trap latched |

## Try it

```bash
curl -sS https://hypernatt.com/api/m2m/mm-trap-state \
  | jq '.state, .trap_direction, .sweep_zone, .chart_verdicts'
```

MCP: `tools/call` → `get_mm_trap_state` on `https://hypernatt.com/mcp/protocol`

HTTP mirror: `GET https://hypernatt.com/api/m2m/mm-trap-state`

More examples: [../docs/example-responses.md](../docs/example-responses.md)

# `get_mm_trap_state`

Live BTC **market-maker trap state**: trap active/idle, hunt direction, latched liquidation cluster, sweep zone bounds, and math-verified sweep/reclaim verdicts. Redacted manipulation weather — no internal detector thresholds.

## Price

**$0.01 USDC** per call via **x402** on **Base** (`eip155:8453`)

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x_payment` | string | No* | Base64 x402 payment payload. Omit first to get payment instructions. |

## Outputs

On success:

- `hypernatt_mm_trap_state_v1` with fields like `state`, `trap_direction`, `cluster_price`, `sweep_zone`, `chart_verdicts`
- Read-only observation — not a trade signal

HTTP mirror: `GET https://hypernatt.com/api/m2m/mm-trap-state`

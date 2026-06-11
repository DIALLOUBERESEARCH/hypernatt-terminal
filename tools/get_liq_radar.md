# `get_liq_radar`

Raw BTC **liquidation radar** snapshot: magnet score, OI build-up, long/short ratio, liquidation clusters above/below price, and real liquidations (1h/24h). The full upstream microstructure block behind `get_mm_hunt_score`.

## Price

**$0.01 USDC** per call via **x402** on **Base** (`eip155:8453`)

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x_payment` | string | No* | Base64 x402 payment payload. Omit first to get payment instructions. |

## Outputs

On success:

- `hypernatt_liq_radar_v1` product payload with `liq_radar` block (redacted: no internal HLP vault leak)
- Read-only market context — not a trade signal

HTTP mirror: `GET https://hypernatt.com/api/m2m/liq-radar`

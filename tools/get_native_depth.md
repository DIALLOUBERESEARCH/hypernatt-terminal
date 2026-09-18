# `get_native_depth`

Recorded liquidity, wall history and aggressor flow for a **BTC or ETH** size. REF is 20 levels; aggregated views span wider prices at coarser precision.

## Price

**0.001 USDC** via x402 (Base or Solana) or one eligible credit after an available daily trial.

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | string | Yes | `BTC` or `ETH` only. |
| `side` | string | Yes | `buy` or `sell`. |
| `quantity_base` | string | Yes | Decimal quantity in token units. |
| `lookback_s` | integer | No | `30` or `300`. Wall-size delta on the same filmed stream. |

See [native-depth.md](../docs/native-depth.md).

# `get_native_depth`

Operator-filmed native REF depth for a **BTC or ETH** size. Not the public 20-level vitrine.

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

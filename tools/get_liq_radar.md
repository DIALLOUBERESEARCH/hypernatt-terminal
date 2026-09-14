# `get_liq_radar`

Multi-crypto **forced-order / liquidation map**: magnet bias, OI build-up, long/short ratio, liquidation clusters above/below price, and observed liquidations.

This is **market structure context** (where leveraged liquidations stack) — not a public-indicator substitute and **not** a trade signal.

Schema: `payload_schema: hypernatt_liq_radar_v2`; the current wire `product` retains `hypernatt_liq_radar_v1` for compatibility. Clusters expose `largest_*_cluster` (size leaders within ±10% of mark); `nearest_*_cluster` is a temporary alias for older clients.

## Price

| Tier | Cost |
|------|------|
| **Credits** | **1** |
| **Paygo** | **$0.001 USDC** / call via **x402** on **Base (EIP-3009)** or **Solana (SVM exact)** |
| **Daily MCP trial** | One call per token/client each UTC day; separate from the other three paid tools |
| **Pass / quota** | Eligible shared credits; Agent Pass $5 for 15,000 credits/30 days or swap-earned quota |

Solana is **not** "Base with another chain id". The SVM rail is **live**. An EVM x402 client cannot pay it. Use `@x402/svm`, set `feePayer` from `extra.feePayer` in the 402, amount = `accepts[].amount`, `accepted.asset` = mint. A Base 200 is not a Solana payment. Full notes: [../docs/x402-pay.md](../docs/x402-pay.md).

## Symbols

Optional MCP `symbol`: **BTC ETH SOL BNB XRP HYPE ZEC**. Omit → **BTC**. Use these coin codes; unsupported symbols are rejected. REST aliases do not expand the MCP schema.

## When to use

| Situation | Call |
|-----------|------|
| Need forced-order / liq / OI / cluster terrain on a whitelist coin | **`get_liq_radar`** |
| Start / catalog + scenarios / glossary | `get_agent_manifest` (free) |
| Cross-chain route | `swap_via_nattswap` |

Honest structural walkthrough: [../examples/liq_radar_interpret.py](../examples/liq_radar_interpret.py)

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | string | No | BTC ETH SOL BNB XRP HYPE ZEC (default BTC) |
| `x_payment` | string | No* | Base64 x402 payment payload |
| `agent_wallet` | string | No | Wallet with quota balance |

## Outputs

- `product`: compatibility label (currently `hypernatt_liq_radar_v1`)
- `payload_schema`: `hypernatt_liq_radar_v2`
- `symbol` / `binance_symbol` / `provenance`
- `liq_radar` block (redacted — no HLP vault leak)
- Read-only market context — **not** a trade signal

### Observed liquidation clusters

`liq_radar.real_liquidations.recent_clusters_1h` groups observed **Bybit**
liquidations by side and price bucket. Each row exposes:

- `price`: the base-size-weighted mean of the source bankruptcy prices;
  `price_method`: `size_weighted_bankruptcy_price`.
- `price_min` / `price_max`: the minimum and maximum observed source prices.
- `bucket_low` / `bucket_high`: grouping bounds, lower-inclusive and
  upper-exclusive (currently $100 wide). A lower bound of zero is valid;
  it is **not** the group's representative price.
- `size_btc`: legacy name for the requested coin's base-asset quantity,
  displayed to three decimals; `count`: number of observed events.

These are historical bankruptcy-price aggregates, not Hyperliquid fills,
executable order prices, or predicted liquidation levels. The weighted mean
uses unrounded quantities. Modeled clusters in `liq_density` are separate.

## Try it

```bash
# Unpaid REST discovery returns HTTP 402; see docs/x402-pay.md for retry headers.
curl -sS "https://hypernatt.com/api/m2m/liq-radar?symbol=ETH"
```

MCP: `tools/call` → `get_liq_radar` on `https://hypernatt.com/mcp/protocol`

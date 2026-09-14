# Hyperliquid execution context

Three public Terminal tools cover **BTC, ETH, SOL, BNB, XRP, HYPE and ZEC** perpetuals.
Each call costs **0.001 USDC**, like `get_liq_radar`, through the existing x402
Base/Solana payment or eligible credits. Use `https://hypernatt.com/mcp/protocol`.
Call `get_agent_manifest` first; use `tools/list` for the complete input schemas.

Daily MCP trial: one free call per paid tool and per token per client each UTC day. Four tools x seven tokens = up to 28 independent trials; then 0.001 USDC per call. Read trial_policy_v2 and free_tier_status_v1 on the same MCP connection for current availability. A zero daily_cap is the separate credit pool, not the intro allowance.

## Before an order

Call `get_execution_quote` with a side and a quantity in token units:

```json
{"symbol":"ETH","side":"buy","quantity_base":"0.1"}
```

The tool reads Hyperliquid's native public book (up to 20 levels per side) and
metadata. `result.estimate` separates spread cost, depth cost and exchange/builder
fees, and includes visible depth and estimated VWAP for your quantity. If the
visible book cannot cover it, `full_order_vwap` is null; the partial estimate is
explicitly labelled. An optional `limit_price` caps the hypothetical sweep.

Unknown account fees remain null. Supply `exchange_fee` and `builder_fee` if you
know the rates, with `source: "caller_assumption"` or `"account_rate_supplied"`,
`rate` as a decimal fraction string and `as_of_ms` in UTC milliseconds. For
example, `"0.00045"` means 4.5 basis points. Zero fees must be explicit.
The Terminal API price is separate from estimated trading costs.

The returned baseline contains metadata for the requested token only; the complete observed book and timing remain available. Earlier full-metadata baselines are still accepted.

Save the returned **`baseline` object unchanged** in your agent's own state.

## Between checks

Call `compare_execution_context` with `{"baseline": PREVIOUS_BASELINE}`.
This retrieves a new book for the same symbol, side, quantity, cap and fee
assumptions. Read `result.snapshot_changes`, `result.deltas` and the `before` /
`after` estimates. Save the new returned baseline for your next check.

`refreshed` means the book is identical but observation time advanced. This is a
comparison of snapshots, not a stream that captures every intervening event.
Choose your polling cadence for your workflow; each call has the same price.

## After execution

Call `reconcile_execution` with your pre-order `baseline` and `fills_dataset`:

```json
{
  "provenance": "caller_supplied",
  "completeness": "unknown",
  "account": "0x0000000000000000000000000000000000000001",
  "order_id": "123",
  "fills": [
    {"coin":"ETH","oid":"123","tid":"456","side":"B",
     "time":1789394001000,"px":"2000","sz":"0.1","fee":"0.09","feeToken":"USDC"}
  ]
}
```

These are synthetic format values, not a real execution. Replace them with your
own native fill records for one order (1 to 2,000 fills). `B` is buy, `A` is sell.
The tool compares the estimated and observed prices at the **observed quantity**
and separates the fee difference. Native `fee` already includes `builderFee`;
do not add it again. Fills and their completeness are supplied by you, not
independently authenticated or fetched from your account. Timing evidence can
describe latency; it cannot prove that latency caused a price difference.

## Read the data quality

Numbers use decimal strings. Timestamps use UTC Unix milliseconds. Check
`result.quality` (or `result.after.quality`) plus `delivery` before relying on
current data. `delivery.source_age_signed_ms` includes time spent settling the API
payment. An unknown clock, stale data or caller-supplied historical observation
cannot become `data_usable_at_delivery: true`. This flag describes data quality,
not order eligibility. The service currently reports clock uncertainty explicitly.

Baselines are caller-owned and unsigned. An optional `observation` is for replay
and is always treated as historical. Reconciliation is a historical comparison.
These tools submit no orders and check neither your margin nor your account
permissions. Visible depth and cost estimates do not guarantee a fill.

## Payment and errors

Omit `x_payment` initially to discover access requirements; eligible intro/pass/
quota rules are the same as the radar. When payment is needed, pick a rail from
`accepts[]` and retry the same tool with its x402 payment. See [x402-pay.md](x402-pay.md).
Invalid inputs, failed data preparation and unavailable current books are rejected
before a new credit debit or settlement. Payment rejection releases no computed
result. Busy/timeout errors should be retried with backoff, not a tight loop.

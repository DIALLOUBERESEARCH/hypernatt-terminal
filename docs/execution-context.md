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

`result.fee_status` reports `complete`, `partial` or `unknown`, lists missing
rates and explains unavailable totals. Each supplied fee component is computed
independently. For no builder fee, explicitly supply a zero builder rate; omission
means unknown, never zero. Reconciliation explains a null fee gap with
`result.fee_gap_unavailable_reason` (missing rates, non-USDC actual fees, no fills
or an unavailable/insufficient baseline).

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

Fixed-anchor band deltas are null unless that side's full band is visible in both
snapshots; `*_delta_unavailable_reason` explains incomplete coverage. Null does
not mean liquidity disappeared. Whole visible-book deltas still describe only
the returned levels, whose price range can change between snapshots.

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

Read the top-level **`agent_readout` first** on both MCP and HTTP responses.
It summarizes phase, snapshot status, signed age, age-window check, clock
attestation, full-order VWAP, size coverage, fee status, comparison status and warnings.
Numbers use decimal strings; timestamps use UTC Unix milliseconds.

- `recent_clock_unattested`: a live, available book has a signed age between
  -250 and 5000 ms at delivery, but clock synchronization is unproven. Its
  estimate can be inspected with that uncertainty; recency is indicative.
- `recent_clock_attested`: the same age check with synchronization evidence.
- `outside_age_window`: refresh before using it as a current market estimate.
- `unavailable`: the current estimate or required data is unavailable.
- `historical`: replay or reconciliation, never a live market indication.

`delivery.within_max_age` is the timestamp check, including payment delay.
`delivery.clock_attested` is a separate statement; the public source currently
reports it false. Legacy `usable_now` and `data_usable_at_delivery` retain their
strict certified-fresh meaning for compatibility. Do not use them as a blanket
instruction to discard an indicative estimate. Neither a recent timestamp nor
clock evidence proves order eligibility, adequate depth or a guaranteed fill.

Baselines are caller-owned and unsigned. An optional `observation` is for replay
and is always treated as historical. Reconciliation is a historical comparison.
These tools submit no orders and check neither your margin nor your account
permissions. Visible depth and cost estimates do not guarantee a fill.

## Payment and errors

### HTTP APIs and x402scan

The same three computations are available individually as JSON HTTP APIs:

- `POST https://hypernatt.com/api/m2m/execution-context/quote`
- `POST https://hypernatt.com/api/m2m/execution-context/compare`
- `POST https://hypernatt.com/api/m2m/execution-context/reconcile`

Send the tool arguments directly as the JSON body (no JSON-RPC envelope).
HTTP calls are strictly pay-per-call at 0.001 USDC. First call without a payment
to get HTTP 402 and the `PAYMENT-REQUIRED` header; retry with `PAYMENT-SIGNATURE`
or `X-Payment`. A successful response includes `PAYMENT-RESPONSE`. MCP daily
trials and credits remain available through MCP, not these HTTP routes.
Use the exact `baseline` from quote for compare/reconcile; no account keys needed.
The [OpenAPI catalog](https://hypernatt.com/openapi.json) contains the full schemas.
For x402scan, register `https://hypernatt.com` and its six HTTP resources;
`/mcp/protocol` remains the connection address for MCP clients.

### MCP payment

Omit `x_payment` initially to discover access requirements; eligible intro/pass/
quota rules are the same as the radar. When payment is needed, pick a rail from
`accepts[]` and retry the same tool with its x402 payment. See [x402-pay.md](x402-pay.md).
Invalid inputs, failed data preparation and unavailable current books are rejected
before a new credit debit or settlement. Payment rejection releases no computed
result. Busy/timeout errors should be retried with backoff, not a tight loop.

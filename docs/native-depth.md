# Recorded liquidity and flow for perpetual agents

`get_native_depth` combines the operator's recorded BTC/ETH liquidity views,
fixed-price wall history and observed aggressor flow. Use it with `get_liq_radar`
to compare liquidation terrain with liquidity and trading activity around it.
It provides market context; your agent chooses whether and how to trade.

The service maintains capture and computes the context for you. These are public
Hyperliquid feeds, not exclusive exchange data or a disclosed trading strategy.

```json
{"symbol":"ETH","side":"buy","quantity_base":"1000","lookback_s":300}
```

Quantity is in token units. `lookback_s` accepts 30 or 300 seconds (default300).
Native context supports BTC/ETH; radar supports seven tokens. Price remains
0.001 USDC via existing x402 Base/Solana or eligible credits. Daily MCP trials
are per supported tool/token; read `trial_policy_v2` on your connection.

## Read the context

1. `result.agent_readout` summarizes requested-size coverage, selected view,
   history coverage and observed flow availability.
2. `liquidity_map.views` contains REF/M2/M5/AGG4 at the **same exchange timestamp**.
   REF typically has 20 exact price levels per side. Aggregated views use 20
   coarser bins, often spanning a wider price range. **Never add their volumes.**
3. Each view reports its price span, visible volumes and independent size estimate.
   `selected_view` is the finest view covering the requested size, or the coarsest
   available if none covers it. Coarse VWAP uses rounded prices conservatively;
   it excludes fees and future slippage and does not guarantee execution.
4. `largest_bid_wall` and `largest_ask_wall` report the largest visible bin and
   its change **at that same price**. `prior_size_base=null` means the earlier
   price was not covered or history was missing. It does not mean size zero.
   Read `continuous_coverage`, covered samples and `history.max_snapshot_gap_ms`.
   A disappearing snapshot wall does not prove cancellation or spoofing.
5. `trade_flow` reports observed aggressor buys/sells, signed delta, notional and
   counts over the selected window. Trades are deduplicated by exchange ID;
   pre-subscription bursts are excluded. Coverage/interruption facts are explicit;
   these totals are **observed flow**, not a claim of complete exchange flow.

## Freshness and compatibility

Read `quality.stale` and `delivery.within_age_window`. Stale, synthetic or invalid
sources fail preparation before charging. If settlement takes long enough for
the snapshot to expire, the paid result is delivered with that expiration stated.
Timestamp age is measured; clock synchronization is not independently attested.

Root `filled`, `remaining`, `vwap` and `native_levels_available` retain their REF
meaning. The old `vitrine_*` fields compare the same REF snapshot and do not
demonstrate extra depth. The old total-side `lookback.wall_size_delta` is null;
use each fixed-price wall's `size_delta_base`. Schema is
`hypernatt_native_depth_v2`; transport product remains `hypernatt_native_depth_v1`.

Example reasoning: a radar cluster near a large ask zone can be inspected for
its observed persistence and size change, alongside aggressor buying/selling.
Those facts do not establish a reversal, breakout probability, absorption edge,
or profitable entry. `not_a_signal` is always true. No orders or custody.

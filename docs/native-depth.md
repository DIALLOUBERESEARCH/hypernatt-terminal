# Native REF depth

`get_native_depth` walks the operator-filmed Hyperliquid REF book for **BTC or ETH**.
It is not the public 20-level vitrine. Radar still covers seven tokens.
Native depth is BTC and ETH only. Other symbols are out of scope.

Each call costs **0.001 USDC**, like `get_liq_radar`, through the existing x402
Base/Solana payment or eligible credits. Use `https://hypernatt.com/mcp/protocol`.
Call `get_agent_manifest` first.

Daily MCP trial: radar 7 tokens + native BTC/ETH = up to 9 independent trials;
then 0.001 USDC per call. Read `trial_policy_v2` on the same MCP connection.
A zero `daily_cap` is the separate credit pool, not the intro allowance.

## Call

```json
{"symbol":"ETH","side":"buy","quantity_base":"0.1"}
```

Optional `lookback_s`: `30` or `300`. Wall size delta is on the same filmed stream.
If the prior snapshot is missing, `lookback.reason` is `lookback_snapshot_unavailable`.

## How to read the result

- `filled` / `remaining` / `vwap`: walk of the filmed book for this size.
- `vitrine_cap_20` / `vitrine_filled` / `vitrine_remaining`: counterfactual on the
  **same** snapshot (first 20 levels). Not a second HTTP fetch.
- `native_levels_used` vs `native_levels_available`: coverage of the filmed book.
- `not_a_signal` is always true. This is size feasibility, not an entry recipe.
- `source` is `recorder_REF`.

Read-only. No order, no fill guarantee, no custody.

## Symbols

| Tool | Tokens |
|------|--------|
| `get_liq_radar` | BTC ETH SOL BNB XRP HYPE ZEC |
| `get_native_depth` | BTC ETH only |

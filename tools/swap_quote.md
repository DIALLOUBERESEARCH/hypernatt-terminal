# `swap_quote`

Raw **Li.Fi** swap quote JSON. Same routing as `swap_via_nattswap` but without formatted execution steps.

Cross-chain supported across **Li.Fi-routed chains**.

## Price

**Free** — no x402.

## Inputs

Same as [`swap_via_nattswap`](swap_via_nattswap.md): `fromChain`, `toChain`, `fromToken`, `toToken`, `fromAmount`, `fromAddress`, `toAddress`, optional `slippage`.

## Outputs

Li.Fi quote payload (routes, estimates, tool-specific fields). Use for custom agent parsers; prefer `swap_via_nattswap` for guided execution.

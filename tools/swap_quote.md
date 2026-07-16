# `swap_quote`

Raw **Li.Fi** swap quote JSON. Same routing as `swap_via_nattswap` but without formatted execution steps.

Cross-chain supported across **Li.Fi-routed chains**.

## Price

| Transport | Price |
|-----------|-------|
| MCP tool `swap_quote` | **Free** — no x402 |
| HTTP `GET /api/m2m/swap/quote` | **$0.001 USDC** via x402 |

## HTTP response: `next_step`

Paid HTTP quotes include:

```json
"next_step": {
  "message": "Call swap_via_nattswap MCP tool to get execution instructions",
  "doc": "https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/blob/main/tools/swap_via_nattswap.md"
}
```

Use this to chain preview (HTTP) → execution (MCP).

## Execution readiness (F#50N)

Quotes include `execution_readiness` and `swap_execution_playbook_v1`:

- `can_execute: false` → do **not** broadcast; fix `blockers` (often wrong `fromAddress` or public vault paste).
- Prefer **`swap_via_nattswap`** for guided steps.

Guide: [swap-agentkit.md](../docs/swap-agentkit.md)

## Inputs

Same as [`swap_via_nattswap`](swap_via_nattswap.md): `fromChain`, `toChain`, `fromToken`, `toToken`, `fromAmount`, `fromAddress`, `toAddress`, optional `slippage`.

## Outputs

Li.Fi quote payload (routes, estimates, tool-specific fields). Use for custom agent parsers; prefer `swap_via_nattswap` for guided execution.

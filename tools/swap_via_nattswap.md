# `swap_via_nattswap`

Cross-chain swap quote via **Li.Fi** with step-by-step execution instructions for your agent wallet.

**Free** at the MCP layer (no x402). On-chain execution costs gas plus **0.5% integrator fee** on swap volume.

## When to use

| Situation | Call |
|-----------|------|
| Bridge or fund a wallet across chains | `swap_via_nattswap` |
| Preview only (no instructions) | `swap_quote` |

## Inputs

Same as [`swap_quote`](swap_quote.md): `fromChain`, `toChain`, `fromToken`, `toToken`, `fromAmount`, `fromAddress`, `toAddress`, optional `slippage`.

## Flow

1. Call **`swap_via_nattswap`** → receive Li.Fi `transactionRequest` + `execution_readiness` + optional **`swap_actions_v1`** (F#54N).
2. If `execution_readiness.can_execute` is `false`, fix blockers (see [swap-agentkit.md](../docs/swap-agentkit.md)).
3. Prefer signing **`swap_actions_v1.actions`** in order (`approve` then `swap`). Else approve ERC-20 if needed, then broadcast `transactionRequest`.
4. Optional: `GET https://hypernatt.com/api/m2m/swap/status/:txHash?fromChain=…` to poll bridge status.
5. Optional: `POST https://hypernatt.com/api/m2m/swap/register` (see `register_hint` in `swap_actions_v1`).

Swap volume may qualify for **Decision Core quota credits** — see `GET https://hypernatt.com/api/m2m/quota/status`.

## Related tools

| Tool | Role |
|------|------|
| `swap_quote` | Raw Li.Fi JSON only |
| `get_agent_manifest` | Pricing, free tools, quota program |

# `swap_via_nattswap`

Cross-chain swap quote via **Li.Fi** with step-by-step execution instructions for your agent wallet.

**Free** at the MCP layer (no x402). On-chain execution costs gas plus HyperNatt integrator fee 0.5%; Li.Fi may add its own cut — read `quote.estimate.feeCosts` on the live quote.

This is the **only** swap tool on the MCP surface (v2.8.0).

## When to use

| Situation | Call |
|-----------|------|
| Bridge or fund a wallet across chains | `swap_via_nattswap` |
| Catalog / pricing | `get_agent_manifest` |
| Liq / cluster context first | `get_liq_radar` |

## Inputs

`fromChain`, `toChain`, `fromToken`, `toToken`, `fromAmount`, `fromAddress`, `toAddress`, optional `slippage`.

Use **your** agent signing wallet for `fromAddress` / `toAddress`.

## Flow

1. Call **`swap_via_nattswap`** → receive Li.Fi `transactionRequest` + `execution_readiness` + optional **`swap_actions_v1`**.
2. If `execution_readiness.can_execute` is `false`, fix blockers (see [swap-agentkit.md](../docs/swap-agentkit.md)).
3. Prefer signing **`swap_actions_v1.actions`** in order (`approve` then `swap`). Else approve ERC-20 if needed, then broadcast `transactionRequest`.
4. Optional: `GET https://hypernatt.com/api/m2m/swap/status/:txHash?fromChain=…` to poll bridge status.
5. Optional: `POST https://hypernatt.com/api/m2m/swap/register` (see `register_hint` in `swap_actions_v1`).

Eligible completed swap volume may earn **shared credits** for `get_liq_radar`, `get_execution_quote`, `compare_execution_context` and `reconcile_execution`. See `GET https://hypernatt.com/api/m2m/quota/status?wallet=0xYourWallet` and the [payment guide](../docs/x402-pay.md).

## Optional HTTP footnote

`GET /api/m2m/swap/quote` costs 0.001 USDC via x402 and returns raw Li.Fi JSON only. It is **not** an MCP tool —
prefer `swap_via_nattswap` for agents.

## Related tools

| Tool | Role |
|------|------|
| `get_agent_manifest` | Pricing, catalog, journey |
| `get_liq_radar` | Read-only liq / OI / cluster context |

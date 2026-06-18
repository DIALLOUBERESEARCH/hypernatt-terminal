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

1. Call **`swap_via_nattswap`** → receive Li.Fi `transactionRequest` + instructions.
2. Approve ERC-20 if needed, then sign and broadcast on the source chain.
3. Optional: `GET https://hypernatt.com/api/m2m/swap/status/:txHash?fromChain=…` to poll bridge status.

Swap volume may qualify for **Decision Core quota credits** — see `GET https://hypernatt.com/api/m2m/quota/status`.

## Related tools

| Tool | Role |
|------|------|
| `swap_quote` | Raw Li.Fi JSON only |
| `get_agent_manifest` | Pricing, free tools, quota program |

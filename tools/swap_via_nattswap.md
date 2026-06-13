# `swap_via_nattswap`

Cross-chain swap quote and **step-by-step execution instructions** via **Li.Fi** (NattSwap). Supports **Li.Fi-routed chains** — not limited to Base.

**Decision Core signals remain BTC/USDC only.** This tool is for treasury / gas / routing needs, not for changing the vault signal pair.

## Price

**Free** at the MCP layer (no x402). Revenue: **0.5% integrator fee** on executed swap volume. Completed swaps can **earn Decision Core quotas** and NDAT (register via `register_nattswap_reward`).

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fromChain` | number/string | Yes | Source chain ID (e.g. `1` Ethereum, `8453` Base) |
| `toChain` | number/string | Yes | Destination chain ID |
| `fromToken` | string | Yes | Source token address or symbol |
| `toToken` | string | Yes | Destination token address or symbol |
| `fromAmount` | string | Yes | Amount in smallest unit (wei) |
| `fromAddress` | string | Yes | Sender wallet |
| `toAddress` | string | Yes | Recipient wallet |
| `slippage` | number | No | Slippage tolerance (default server-side) |

## Outputs

- Li.Fi route summary
- Human/agent-readable steps to sign and broadcast
- Links to verify transaction after execution

## Quota program

After swap completes on-chain, call `register_nattswap_reward` with `txHash` + `agentAddress` to credit quotas. Status: `GET https://hypernatt.com/api/m2m/quota/status`

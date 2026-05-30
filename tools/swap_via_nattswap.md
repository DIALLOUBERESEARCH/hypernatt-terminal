# `swap_via_nattswap`

Cross-chain **swap quote via Li.Fi (NattSwap)** with step-by-step execution instructions for your agent wallet. May include optional `recommended_action` nudge toward Decision Core after a successful quote.

## Price

**Free** (no x402). On-chain gas/bridge fees apply when you execute. HyperNatt monetizes via Li.Fi integrator fees on the route.

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fromChain` | number \| string | Yes | Source chain ID (e.g. `8453` for Base) |
| `toChain` | number \| string | Yes | Destination chain ID |
| `fromToken` | string | Yes | Source token contract address |
| `toToken` | string | Yes | Destination token contract address |
| `fromAmount` | string | Yes | Amount in token smallest units (wei) |
| `fromAddress` | string | Yes | Sender wallet address |
| `toAddress` | string | Yes | Recipient wallet address |
| `slippage` | number | No | Slippage tolerance (percent) |

## Outputs

- Li.Fi quote (`data`): routes, estimates, `transactionRequest`
- `instructions`: approve → send tx → `register_nattswap_reward` after confirmation
- `verification`: vault/stats proof links
- Optional `recommended_action` (rate-limited 1/h per agent wallet) — not present on `swap_quote`

## Example — MCP

```http
POST https://hypernatt.com/mcp/protocol
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "swap_via_nattswap",
    "arguments": {
      "fromChain": 8453,
      "toChain": 42161,
      "fromToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "toToken": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      "fromAmount": "1000000",
      "fromAddress": "0xYourAgentWallet",
      "toAddress": "0xYourAgentWallet",
      "slippage": 0.5
    }
  }
}
```

## Notes

HyperNatt does **not** custody funds. You sign and broadcast transactions from your own wallet.

# `swap_quote`

Raw **Li.Fi cross-chain swap quote** JSON. Same routing as `swap_via_nattswap` without the instruction wrapper or `recommended_action`.

## Price

**Free** (no x402)

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fromChain` | number \| string | Yes | Source chain ID |
| `toChain` | number \| string | Yes | Destination chain ID |
| `fromToken` | string | Yes | Source token address |
| `toToken` | string | Yes | Destination token address |
| `fromAmount` | string | Yes | Amount in smallest units |
| `fromAddress` | string | Yes | Sender wallet |
| `toAddress` | string | Yes | Recipient wallet |
| `slippage` | number | No | Slippage percent |

## Outputs

- `ok`: true
- `source`: `hypernatt-terminal`
- `data`: raw Li.Fi quote object

## Example — MCP

```http
POST https://hypernatt.com/mcp/protocol
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "swap_quote",
    "arguments": {
      "fromChain": 8453,
      "toChain": 8453,
      "fromToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "toToken": "0x4200000000000000000000000000000000000006",
      "fromAmount": "5000000",
      "fromAddress": "0xYourAgentWallet",
      "toAddress": "0xYourAgentWallet"
    }
  }
}
```

## Notes

Use `swap_via_nattswap` if you want agent-friendly execution steps. Use `swap_quote` for minimal JSON integration.

# `get_btc_usdc_signal`

Live **Mimo BTC/USDC vault cycle state** on Hyperliquid: direction context (**LONG** / **SHORT** / **HOLD**), active cycle metadata, and on-chain proof links.

## Price

**$0.01 USDC** per call via **x402** on **Base** (`eip155:8453`)

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x_payment` | string | No* | Base64 x402 payment payload. Omit on first call to receive payment instructions. |
| `full_payload` | boolean | No | If `true`, return full JSON; default compact summary. |

\*Required on retry after paying.

## Outputs

On success:

- Cycle direction and conviction context from the live vault
- `proof` / verification metadata: vault URL, stats URL, snapshot hash
- `source`: `hypernatt-terminal`

On first call without payment:

- x402 payment requirements (`accepts`, treasury address, amount)
- `mcp_hint` for retry with `x_payment`

## Example — MCP (first call, no payment)

```http
POST https://hypernatt.com/mcp/protocol
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_btc_usdc_signal",
    "arguments": {}
  }
}
```

## Example — MCP (paid retry)

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_btc_usdc_signal",
    "arguments": {
      "x_payment": "<base64-x402-payment-payload>"
    }
  }
}
```

## Example — REST

```bash
# First call → HTTP 402 with payment instructions
curl -sS -D - "https://hypernatt.com/api/m2m/signal"

# Paid retry
curl -sS "https://hypernatt.com/api/m2m/signal" \
  -H "X-Payment: <base64-x402-payment-payload>"
```

## Notes

**Read-only context — not a trade signal.** Verify against the public vault: https://app.hyperliquid.xyz/vaults/0x04e2eb302fe9ff23a9d1f2455084af624737a6d8

# `get_similarity_match`

**Top-3 historical microstructure matches** vs the current BTC regime, with observed ~4h BTC outcomes. Regime analogy — not a forecast.

## Price

**$0.01 USDC** per call via **x402** on **Base** (`eip155:8453`)

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x_payment` | string | No* | Base64 x402 payment payload. Omit first to get payment instructions. |
| `full_payload` | boolean | No | Full JSON vs compact summary. |

## Outputs

On success:

- Top-3 historical matches with similarity scores
- Observed ~4h BTC outcomes for matched regimes
- Verification metadata

Without payment: x402 payment requirements.

## Example — MCP

```http
POST https://hypernatt.com/mcp/protocol
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_similarity_match",
    "arguments": { "full_payload": false }
  }
}
```

## Example — REST

```bash
curl -sS "https://hypernatt.com/api/m2m/similarity-match"
```

## Notes

**Read-only analogy — not a trade signal.** Historical matches describe past regimes; verify current vault state separately.

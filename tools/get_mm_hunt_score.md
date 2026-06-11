# `get_mm_hunt_score`

BTC perp **market-maker hunt / liquidation pressure** score and long-trap phase context. Microstructure read for agents assessing hunt or trap risk.

## Price

**$0.01 USDC** per call via **x402** on **Base** (`eip155:8453`)

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x_payment` | string | No* | Base64 x402 payment payload. Omit first to get payment instructions. |
| `full_payload` | boolean | No | Full JSON vs compact summary. |

## Outputs

On success:

- MM hunt score and phase indicators
- Verification / proof metadata
- Read-only microstructure context

Without payment: x402 `accepts` block and retry hint.

## Example — MCP

```http
POST https://hypernatt.com/mcp/protocol
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_mm_hunt_score",
    "arguments": {}
  }
}
```

## Example — REST

```bash
curl -sS "https://hypernatt.com/api/m2m/mm-hunt"
```

## Notes

**Read-only context — not a trade signal.** Pair with `get_btc_usdc_signal`, `get_similarity_match`, `get_liq_radar`, and `get_mm_trap_state` for the full Decision Core picture (5 paid tools).

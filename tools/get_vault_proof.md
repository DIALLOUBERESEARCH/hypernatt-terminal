# `get_vault_proof`

Free on-chain vault proof for the Mimo BTC/USDC Hyperliquid vault. No performance metrics — verify live yourself.

## Price

**Free** (no x402)

## Inputs

None.

## Outputs

| Field | Description |
|-------|-------------|
| `vault_address` | Hyperliquid vault address |
| `vault_url` | Public vault page on Hyperliquid |
| `stats_url` | https://hypernatt.com/stats |
| `snapshot_hash` | Latest signed cycle snapshot (`sha256:…`) |
| `live_since` | `"80+ days"` |
| `agent_identity.erc8004_agent_id` | `18877` |
| `disclaimer` | No winrate stated — verify on-chain |

## Example — MCP

```http
POST https://hypernatt.com/mcp/protocol
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_vault_proof",
    "arguments": {}
  }
}
```

## Notes

Call after `get_agent_manifest`, before paid Decision Core tools. Same snapshot hash algorithm as `get_btc_usdc_signal`.

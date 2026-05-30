# `get_agent_balance`

Check **pending and claimed NDAT** balance for an agent wallet on the HyperNatt rewards ledger.

## Price

**Free**

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `wallet` | string | Yes | Agent EVM address (0x…) |

## Outputs

- `ok`: true
- `data`: pending NDAT, claimed NDAT, ledger metadata

## Example — MCP

```http
POST https://hypernatt.com/mcp/protocol
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_agent_balance",
    "arguments": {
      "wallet": "0xYourAgentWallet"
    }
  }
}
```

## Example — REST

```bash
curl -sS "https://hypernatt.com/api/m2m/ndat/balance/0xYourAgentWallet"
```

## Notes

Register completed swaps with `register_nattswap_reward` before expecting pending balance to increase.

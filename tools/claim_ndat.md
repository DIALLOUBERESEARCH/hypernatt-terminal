# `claim_ndat`

Generate an **ECDSA signature payload** to claim pending **NDAT** on Base via the NattDataAnchor contract. Your agent submits the on-chain claim and pays gas.

## Price

**Free** (MCP call). You pay Base gas for the claim transaction.

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `wallet` | string | Yes | Agent EVM address claiming NDAT |
| `amount` | number | No | NDAT amount to claim; omit to claim all pending |

## Outputs

- Claim signature payload and contract parameters
- `verification`: vault/stats proof links

## Example — MCP

```http
POST https://hypernatt.com/mcp/protocol
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "claim_ndat",
    "arguments": {
      "wallet": "0xYourAgentWallet"
    }
  }
}
```

## Example — REST

```bash
curl -sS -X POST "https://hypernatt.com/api/m2m/ndat/claim" \
  -H "Content-Type: application/json" \
  -d '{"wallet":"0xYourAgentWallet"}'
```

## Notes

Check balance first with `get_agent_balance`. HyperNatt does not submit the claim transaction for you.

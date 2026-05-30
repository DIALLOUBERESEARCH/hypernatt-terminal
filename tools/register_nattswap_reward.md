# `register_nattswap_reward`

Register a **completed NattSwap / Li.Fi transaction hash** to credit **NDAT** rewards to your agent wallet.

## Price

**Free**

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `txHash` | string | Yes | Source-chain transaction hash of the completed swap |
| `agentAddress` | string | Yes | Agent wallet that executed the swap |

## Outputs

- Registration confirmation
- Credited reward amount (if eligible)
- Error details if tx already registered or ineligible

## Example — MCP

```http
POST https://hypernatt.com/mcp/protocol
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "register_nattswap_reward",
    "arguments": {
      "txHash": "0xabc123...",
      "agentAddress": "0xYourAgentWallet"
    }
  }
}
```

## Example — REST

```bash
curl -sS -X POST "https://hypernatt.com/api/m2m/swap/register" \
  -H "Content-Type: application/json" \
  -d '{"txHash":"0xabc123...","agentAddress":"0xYourAgentWallet"}'
```

## Notes

Call **after** the swap transaction is confirmed on-chain. Then use `get_agent_balance` → `claim_ndat`.

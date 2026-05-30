# `get_referral_link`

Generate a **referral URL** and deposit-field hint for inviting other AI agents to HyperNatt Terminal / NattSwap.

## Price

**Free**

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `referrer` | string | Yes | Referrer agent EVM address |

## Outputs

- Referral link URL
- Deposit / attribution field hints for downstream agents

## Example — MCP

```http
POST https://hypernatt.com/mcp/protocol
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_referral_link",
    "arguments": {
      "referrer": "0xYourAgentWallet"
    }
  }
}
```

## Example — REST

```bash
curl -sS "https://hypernatt.com/api/m2m/referral/link/0xYourAgentWallet"
```

## Notes

Use after you are familiar with swap and rewards flow. Referral mechanics are documented in the quickstart.

# `claim_ndat`

Build an **ECDSA claim payload** to withdraw **pending NDAT** on **Base**. Your agent signs and broadcasts the transaction — **you pay gas**.

Answers: *How do I move pending NDAT on-chain into my wallet?*

Free at the MCP layer; on-chain gas applies at execution.

## Price

**Free** — MCP call is free. **Gas on Base** when you submit the claim tx.

## When to use

| Situation | Call |
|-----------|------|
| `get_agent_balance` shows `pending_ndat` > 0 | `claim_ndat` |
| Batch withdraw all pending | `claim_ndat` (omit `amount`) |
| Partial withdraw | `claim_ndat` with `amount` |

**Suggested loop:** `register_nattswap_reward` → `get_agent_balance` → **claim_ndat** → verify balance again.

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `wallet` | string | Yes | Agent EVM address (`0x…`) that earned NDAT |
| `amount` | number | No | NDAT to claim; omit to claim **all** pending |

## Example response

```json
{
  "ok": true,
  "source": "hypernatt-terminal",
  "data": {
    "wallet": "0x1234…abcd",
    "amount": 42.5,
    "signature": "0x…",
    "deadline": 1718280000,
    "verification": {
      "ndat_contract": "0x…",
      "chain": "base"
    }
  }
}
```

Use the returned signature payload with your wallet signer / agent executor on Base. Exact fields are in the API response — do not guess the contract call shape.

## Field guide

| Field | Meaning |
|-------|---------|
| `amount` | NDAT units being claimed |
| `signature` | ECDSA material for the on-chain claim |
| `deadline` | Expiry for the signed payload |
| `verification` | Contract + chain hints for audit |

## Related tools

| Tool | Role |
|------|------|
| `get_agent_balance` | Check pending vs claimed before/after claim |
| `register_nattswap_reward` | Earn pending NDAT from completed swaps |

## Try it

MCP: `tools/call` → `claim_ndat` with `{ "wallet": "0x…" }` on `https://hypernatt.com/mcp/protocol`

HTTP mirror: `POST https://hypernatt.com/api/m2m/ndat/claim` with JSON body `{ "wallet": "0x…" }`

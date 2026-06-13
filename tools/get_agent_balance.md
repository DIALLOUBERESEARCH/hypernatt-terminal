# `get_agent_balance`

Check **pending and claimed NDAT** token balance for your agent wallet on **Base**.

Answers: *How much NDAT have I earned from NattSwap volume? What is still pending vs already claimed?*

Free orientation tool — use after **`register_nattswap_reward`** credits a completed swap.

## Price

**Free** — no x402, no credits.

## When to use

| Situation | Call |
|-----------|------|
| After `register_nattswap_reward` | `get_agent_balance` |
| Before `claim_ndat` | `get_agent_balance` |
| Audit rewards for a wallet | `get_agent_balance` |

**Suggested loop:** swap → `register_nattswap_reward` → **balance** → `claim_ndat`.

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `wallet` | string | Yes | Agent EVM address (`0x…`) on Base |

## Example response

```json
{
  "ok": true,
  "source": "hypernatt-terminal",
  "data": {
    "wallet": "0x1234…abcd",
    "pending_ndat": 42.5,
    "claimed_ndat": 120.0,
    "total_earned_ndat": 162.5
  }
}
```

Field names may vary slightly by API version; always read `pending` vs `claimed` before calling `claim_ndat`.

## Field guide

| Field | Meaning |
|-------|---------|
| `pending_ndat` | Accrued but not yet withdrawn on-chain |
| `claimed_ndat` | Already claimed to the wallet |
| `total_earned_ndat` | Lifetime rewards from registered swaps |

## Related tools

| Tool | Role |
|------|------|
| `register_nattswap_reward` | Credit NDAT + swap quotas after on-chain swap tx |
| `claim_ndat` | Build ECDSA payload to withdraw pending NDAT (you pay gas) |
| `get_referral_link` | Referral URL for agent invites |

## Try it

```bash
curl -sS "https://hypernatt.com/api/m2m/ndat/balance/0xYOUR_WALLET" \
  | jq '.pending_ndat, .claimed_ndat'
```

MCP: `tools/call` → `get_agent_balance` with `{ "wallet": "0x…" }` on `https://hypernatt.com/mcp/protocol`

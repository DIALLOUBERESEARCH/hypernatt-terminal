# `get_agent_manifest`

**Start here.** Free compact catalog (tools, prices, cluster `do_not`, honest usage). Pass `detail=full` for quota/pass/onboarding.

## Price

**Free**

## Live MCP surface (3 tools)

| Tool | Role | Price |
|------|------|-------|
| `get_agent_manifest` | Catalog, value prop, scenarios, glossary | Free |
| `get_liq_radar` | Forced-order / liquidation map (BTC ETH SOL BNB XRP HYPE ZEC) | 1 credit / $0.001 x402 |
| `swap_via_nattswap` | Li.Fi quote + execution playbook | Free at MCP layer |

Suggested journey: manifest → `get_liq_radar` → optional `swap_via_nattswap`.

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `locale` | string | No | Not a translation switch. Ignored. English only. |
| `detail` | string | No | Default `compact`. `full` = quota/pass/onboarding. |

## Outputs

JSON manifest with:

- `terminal` — `"hypernatt-terminal"`
- `description` — terminal tagline
- `agent_interpretation_rules_v1` — value prop + 3 honest scenarios + glossary
- `sections[]` — tool groups with `name`, `role`, `price`
- Optional live 24h usage counters

## Example — MCP

```http
POST https://hypernatt.com/mcp/protocol
Content-Type: application/json
Accept: application/json, text/event-stream

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_agent_manifest",
    "arguments": {}
  }
}
```

## Example — REST

```bash
curl -sS "https://hypernatt.com/api/m2m/agent/manifest"
```

## Notes

Call this before any paid tool. No x402 required.
Agent Pass: **$5/mo**.

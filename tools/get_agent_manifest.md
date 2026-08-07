# `get_agent_manifest`

**Start here.** Free catalog of HyperNatt Terminal MCP tools (v2.7.0).

## Price

**Free**

## Live MCP surface (3 tools)

| Tool | Role | Price |
|------|------|-------|
| `get_agent_manifest` | Catalog, pricing, journey | Free |
| `get_liq_radar` | Liquidation radar (BTC ETH SOL BNB XRP HYPE ZEC) | 1 credit / $0.001 x402 |
| `swap_via_nattswap` | Li.Fi quote + execution playbook | Free at MCP layer |

Suggested journey: manifest → `get_liq_radar` → optional `swap_via_nattswap`.

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `locale` | string | No | `en` or `fr` (default `en`) |

## Outputs

JSON manifest with:

- `terminal` — `"hypernatt-terminal"`
- `description` — terminal tagline
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
    "arguments": { "locale": "en" }
  }
}
```

## Example — REST

```bash
curl -sS "https://hypernatt.com/api/m2m/agent/manifest?locale=en"
```

## Notes

Call this before any paid tool. No x402 required.
Agent Pass: **$5/mo**.

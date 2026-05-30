# `get_agent_manifest`

**Start here.** Free catalog of all HyperNatt Terminal tools: sections, prices, roles, and optional live 24h usage stats.

## Price

**Free**

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `locale` | string | No | `en` or `fr` (default `en`) |

## Outputs

JSON manifest with:

- `terminal` — `"hypernatt-terminal"`
- `description` — terminal tagline
- `sections[]` — **Decision Core**, **Execution**, **Rewards & Referral**
  - Each section: `name`, `description`, `tools[]` with `name`, `role`, `price`
  - Decision Core may include `usage` (24h public counters: swaps, signals, active agents)

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

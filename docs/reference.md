# HyperNatt Terminal — technical reference

Thin pointer. Live MCP is **v2.8.0** with **6 tools**.

Start here: [quickstart.md](quickstart.md)

---

## MCP tools (canonical)

| Tool | Role | Price |
|------|------|-------|
| [`get_agent_manifest`](../tools/get_agent_manifest.md) | Catalog, pricing, journey | Free |
| [`get_liq_radar`](../tools/get_liq_radar.md) | Liquidation radar (whitelist coins) | 1 credit / $0.001 x402 |
| [`swap_via_nattswap`](../tools/swap_via_nattswap.md) | Li.Fi quote + agent execution playbook | Free at MCP layer |
| [`get_execution_quote`](execution-context.md#before-an-order) | Depth, estimated VWAP, spread and separate fees | 1 credit / $0.001 x402 |
| [`compare_execution_context`](execution-context.md#between-checks) | Same-order snapshot comparison | 1 credit / $0.001 x402 |
| [`reconcile_execution`](execution-context.md#after-execution) | Supplied fills versus the pre-order baseline | 1 credit / $0.001 x402 |

**Symbols for `get_liq_radar`:** BTC ETH SOL BNB XRP HYPE ZEC (omit = BTC).

---

## Connect

| Method | URL |
|--------|-----|
| MCP Streamable HTTP | `https://hypernatt.com/mcp/protocol` |
| SSE | `https://hypernatt.com/mcp/sse` |
| Server card | `https://hypernatt.com/.well-known/mcp/server-card.json` |
| REST manifest | `GET https://hypernatt.com/api/m2m/agent/manifest` |

```json
{
  "mcpServers": {
    "hypernatt-terminal": {
      "url": "https://hypernatt.com/mcp/protocol"
    }
  }
}
```

```bash
npx -y @smithery/cli@latest mcp add hypernatt/hypernatt-terminal
```

---

## Pricing (at a glance)

| | Intro | Agent Pass $5/mo | Paygo |
|---|-------|------------------|-------|
| MCP install | Yes | Yes | Yes |
| First `get_liq_radar` call | Free (intro) | included | included |
| Monthly credits | — | ~15,000 / 30 days | — |
| Swap-earned credits | Yes | Yes | Yes |

Paywall order: intro-free → swap quota → Agent Pass $5/mo → $0.001 USDC/credit (x402 on Base + Solana).

---

## Suggested journey

1. `get_agent_manifest` (free)
2. `get_liq_radar` (optional `symbol`)
3. Optional `swap_via_nattswap` — you sign with your agent wallet

Sample response: [example-responses.md](example-responses.md)

---

## Optional HTTP footnote (not MCP tools)

| Endpoint | Note |
|----------|------|
| `GET /api/m2m/liq-radar` | Same payload as MCP `get_liq_radar` |
| `GET /api/m2m/swap/quote` | Raw Li.Fi quote JSON only — **not** an MCP tool |

Base: `https://hypernatt.com`

---

## More guides

- [integrations.md](integrations.md)
- [execution-context.md](execution-context.md) - before, during and after; all seven Terminal tokens
- [agent-liq-radar-loop.md](agent-liq-radar-loop.md)
- [agent-hl-sovereignty.md](agent-hl-sovereignty.md)
- [swap-agentkit.md](swap-agentkit.md)

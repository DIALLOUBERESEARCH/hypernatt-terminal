# HyperNatt Terminal — Agent Quickstart

**Platform:** [https://hypernatt.com](https://hypernatt.com) — full HyperNatt product. **This doc** covers the **hypernatt-terminal** MCP brick only (`/mcp/protocol`).

**30-second Claude Connectors block** (Name / URL table): see [../README.md](../README.md#quick-start-30-seconds).

**Humans (Claude / Cursor):** add connector `https://hypernatt.com/mcp/protocol`, then ask:

> Call get_agent_manifest and choose journeys_v1 for my task. Use get_liq_radar for liquidation terrain, get_execution_quote for the costs of my intended Hyperliquid order, compare_execution_context for changes, reconcile_execution for my supplied fills, or swap_via_nattswap for a Li.Fi route. Call only what my task needs.

**Agents:** 6 tools · v2.8.0. **Smithery:** https://smithery.ai/servers/hypernatt/hypernatt-terminal

**HL agent (read terrain only):** [../examples/hyperliquid/read_terrain.py](../examples/hyperliquid/read_terrain.py) · sovereignty: [agent-hl-sovereignty.md](agent-hl-sovereignty.md)

**What this provides:** liquidation terrain, order-size execution estimates, snapshot comparison, supplied-fill reconciliation and Li.Fi routing. The agent controls its decisions and any order execution. [Tools and workflows](reference.md).

Daily MCP trial: one free call per paid tool and per token per client each UTC day. Four tools x seven tokens = up to 28 independent trials; then 0.001 USDC per call. Read trial_policy_v2 and free_tier_status_v1 on the same MCP connection for current availability. A zero daily_cap is the separate credit pool, not the intro allowance.

### Optional wallet setup for paid calls

After a tool/token trial slot is used, each of the four paid tools requires **0.001 USDC or one eligible credit**. Read MCP tool errors for payment requirements even when HTTP returns 200. Direct public REST discovery routes do not provide MCP intro slots. **Base** uses EIP-3009; **Solana** uses SVM exact (`@x402/svm`), not an EVM signer. See [x402-pay.md](x402-pay.md). One optional wallet integration is Coinbase Agentic Wallet:

```bash
npx @coinbase/payments-mcp
```

Follow the provider's current setup and funding options, then connect Terminal. Payment automation depends on the client and its spending authorization. Guide: https://docs.cdp.coinbase.com/agentic-wallet/mcp/welcome

---

## Liquidation terrain path

1. **`get_agent_manifest`** (free) — choose `journeys_v1` by intent; compact includes argument examples, quality checks and baseline handoff. This path is for liquidation terrain.
2. **`get_liq_radar`** ($0.001) — optional `symbol` among BTC ETH SOL BNB XRP HYPE ZEC (omit = BTC)
3. Optional **`swap_via_nattswap`** — Li.Fi route; you sign

Honest field walkthrough: [../examples/liq_radar_interpret.py](../examples/liq_radar_interpret.py)

Abbreviated example `get_liq_radar` shape (illustrative values; `product` retains a compatibility label while `payload_schema` identifies the schema):

```json
{
  "ok": true,
  "product": "hypernatt_liq_radar_v1",
  "payload_schema": "hypernatt_liq_radar_v2",
  "symbol": "ETH",
  "binance_symbol": "ETHUSDT",
  "liq_radar": { "available": true }
}
```

---

## Follow an intended Hyperliquid order

Use `get_execution_quote` before the order, retain its `baseline`, then `compare_execution_context` for changes and `reconcile_execution` with your fills afterwards. Each call costs 0.001 USDC. [Exact inputs and data quality](execution-context.md).

## Connect

| Client | Endpoint |
|--------|----------|
| Streamable HTTP | `https://hypernatt.com/mcp/protocol` |
| Server card | `https://hypernatt.com/.well-known/mcp/server-card.json` |
| REST catalog | `GET https://hypernatt.com/api/m2m/agent/manifest` |

Tool docs: [../tools/](../tools/)

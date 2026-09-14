# Agent sovereignty: HyperNatt decide, you trade Hyperliquid

Execution tools: `get_execution_quote`, `compare_execution_context`, `reconcile_execution` (0.001 USDC each). [Workflow](execution-context.md).
Read-only liq context for agents that already trade (or want to trade) on **their own**
Hyperliquid account.

**Not trade advice. No custody. No vault deposit required.**

MCP v2.8.0 — **6 tools:** `get_agent_manifest`, `get_liq_radar`, `swap_via_nattswap`.

---

## The idea

| Role | Who | What |
|------|-----|------|
| **Decide** | HyperNatt Terminal (this MCP) | Liq radar context (+ optional swap playbook) |
| **Execute** | **Your** HL agent wallet + any exec MCP/SDK you trust | place / cancel / close on **your** account |
| **Funds** | Your main HL wallet | USDC stays with you |

```
[Hermes / OpenClaw / Claude / NOFX-style agent]
        |
        +-- MCP: hypernatt-terminal  --> get_liq_radar ($0.001 x402)
        |
        +-- MCP/SDK: Hyperliquid exec --> YOUR agent wallet orders
```

---

## Why this matters (sovereignty)

1. You keep risk, keys, and PnL.
2. You pay only for `get_liq_radar` reads you use.
3. You can swap the exec layer without changing HyperNatt.
4. You never send HyperNatt your HL main private key.

Never use a third-party vault address as a signing / `fromAddress` wallet.

---

## Hermes: two MCP servers (copy-paste)

`~/.hermes/config.yaml` — HyperNatt verified; HL exec is **your choice**.

```yaml
mcp_servers:
  hypernatt-terminal:
    url: https://hypernatt.com/mcp/protocol
    transport: streamable-http
  # Replace with YOUR Hyperliquid execution MCP (agent-wallet capable).
  # hyperliquid-exec:
  #   command: "uvx"
  #   args: ["hyperliquid-mcp"]
  #   env:
  #     HL_ACCOUNT_ADDRESS: "0xYourMain"
  #     HL_AGENT_KEY: "..."   # API wallet only — never main seed
```

Restart Hermes after edit. Enable MCP toolset (`native-mcp` skill if needed).

---

## Suggested agent loop

1. `get_agent_manifest` (free)
2. `get_liq_radar` — optional `symbol` (BTC ETH SOL BNB XRP HYPE ZEC)
3. Optional: `swap_via_nattswap` for bridging / funding (you sign)
4. **Your** HL exec tools place/cancel — HyperNatt never does

**Runnable read-only demo (no orders):**
[../examples/hyperliquid/read_terrain.py](../examples/hyperliquid/read_terrain.py)

```bash
python examples/hyperliquid/read_terrain.py
```

---

## OpenClaw / Claude / Cursor

1. Add connector: `https://hypernatt.com/mcp/protocol`
2. Separately configure your HL trading tools / agent wallet
3. Prompt example:

> Use HyperNatt get_liq_radar for BTC (or ETH/SOL/…) microstructure context.
> Do not deposit into any vault. If you trade, use MY Hyperliquid agent wallet tools only.
> Read-only context — not trade advice.

---

## Security checklist

- [ ] HL **agent/API wallet** for bots (trade yes, withdraw no)
- [ ] Main seed **offline**
- [ ] HyperNatt = context only (INV: no orders)
- [ ] Review any third-party exec MCP before pasting keys
- [ ] x402 USDC pays HyperNatt API calls — not HL margin

---

## Links

- MCP: `https://hypernatt.com/mcp/protocol`
- Manifest: `GET https://hypernatt.com/api/m2m/agent/manifest`
- Integrations: [integrations.md](integrations.md)
- Liq loop: [agent-liq-radar-loop.md](agent-liq-radar-loop.md)
- Platform: [https://hypernatt.com](https://hypernatt.com)

# Agent sovereignty: HyperNatt decide, you trade Hyperliquid

Read-only BTC Decision Core for agents that already trade (or want to trade) on **their own** Hyperliquid account.

**Not trade advice. No custody. No vault deposit required.**

---

## The idea

| Role | Who | What |
|------|-----|------|
| **Decide** | HyperNatt Terminal (this MCP) | MM trap / liq radar / hunt / vault proof / cycle context |
| **Execute** | **Your** HL agent wallet + any exec MCP/SDK you trust | place / cancel / close on **your** account |
| **Funds** | Your main HL wallet | USDC stays with you |

HyperNatt vault proof = **credibility** (we cook on-chain). It is **not** where your agent must deposit.

```
[Hermes / OpenClaw / Claude / NOFX-style agent]
        |
        +-- MCP: hypernatt-terminal  --> context ($0.001 x402)
        |
        +-- MCP/SDK: Hyperliquid exec --> YOUR agent wallet orders
```

---

## Why this matters (sovereignty)

1. You keep risk, keys, and PnL.
2. You pay only for Decision Core reads you use.
3. You can swap the exec layer without changing HyperNatt.
4. You never send HyperNatt your HL main private key.

Never use `get_vault_proof.vault_address` as a signing / `fromAddress` wallet.

---

## Hermes: two MCP servers (copy-paste)

`~/.hermes/config.yaml` — HyperNatt verified; HL exec is **your choice** (community MCP or SDK loop).

```yaml
mcp_servers:
  hypernatt-terminal:
    url: https://hypernatt.com/mcp/protocol
    transport: streamable-http
  # Replace with YOUR Hyperliquid execution MCP (agent-wallet capable).
  # Examples exist in the wild as "hyperliquid-mcp" — review security before keys.
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
2. `get_vault_proof` (free) — verify we are live (optional)
3. Call `get_trading_hub` when you need full BTC context — [agent-trading-hub.md](agent-trading-hub.md) (you choose cadence; no mandatory poll)
4. Cross-read `get_mm_trap_state` before sizing risk
5. Optional: `get_btc_usdc_signal` / `get_mm_hunt_score`
6. **Your** HL exec tools place/cancel — HyperNatt never does

---

## OpenClaw / Claude / Cursor

1. Add connector: `https://hypernatt.com/mcp/protocol`
2. Separately configure your HL trading tools / agent wallet
3. Prompt example:

> Use HyperNatt get_liq_radar and get_mm_trap_state for BTC microstructure context.
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

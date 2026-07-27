# HyperNatt Terminal

HyperNatt Terminal — BTC **trading hub** for AI agents: TA + orderflow + liq both sides + MM hunt/trap + regime + ignition + entry-quality + Li.Fi swap.

Full HyperNatt platform: https://hypernatt.com — read-only BTC/USDC context, not trade advice. No custody.

**15 tools · v2.6.0** · Streamable HTTP. Call `get_agent_manifest` first, then **`get_trading_hub`** (you choose when to refresh — no mandatory poll).

Pricing: flat $0.001/call via x402 (Base + Solana). Free: manifest + vault proof. $5/mo Agent Pass (~15k credits).

Guide: [docs/agent-trading-hub.md](docs/agent-trading-hub.md) · Documentation: github.com/DIALLOUBE-RESEARCH/hypernatt-terminal

---

## Try it in 30 seconds (no install, no wallet)

One free public call returns the full catalog (15 tools, prices, ecosystem links):

```bash
curl -s https://hypernatt.com/api/m2m/agent/manifest      # full catalog, free
curl -s https://hypernatt.com/api/m2m/proof-of-edge       # live vault data; edge measurement preliminary — verify on-chain
```

Then verify the vault yourself, on-chain:

- Live vault: https://app.hyperliquid.xyz/vaults/0x04e2eb302fe9ff23a9d1f2455084af624737a6d8
- Public track record: https://hypernatt.com/stats

Want a runnable taste (stdlib only, no wallet)?

```bash
python examples/btc_trap_aware_min.py
```

Read-only BTC/USDC context, not trade advice. No custody. Verify on-chain.

---

## Documentation

- [Quickstart](docs/quickstart.md) — connect Claude / Cursor in 30 seconds
- [Integrations](docs/integrations.md) — MCP clients, REST + x402, Hermes, agent frameworks
- [Swap execution (AgentKit / wallet)](docs/swap-agentkit.md) — quote → sign → register
- [Agent swap demo](docs/agent-swap-demo.md) — wallet-first walkthrough for builders
- [Examples](examples/README.md) — `swap_after_signal.py` (stdlib trap → swap)
- [Hermes skill](skills/hypernatt-terminal/SKILL.md) — agentskills.io onboarding (optional)
- [Security & trust](SECURITY.md) — no custody, no keys, read-only; verify yourself
- [Example responses](docs/example-responses.md) — live JSON samples
- [Tool reference](tools/README.md) — per-tool docs
- [Full technical reference](docs/reference.md) — manifest sections, REST API, Docker, pricing tables
- [Glama submission](docs/glama.md)

[![DIALLOUBE-RESEARCH/hypernatt-terminal MCP server](https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal/badges/score.svg)](https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal)

[![HyperNatt Terminal on x402-list](https://x402-list.com/badge/hypernatt-terminal.svg?data=uptime)](https://x402-list.com/services/hypernatt-terminal?utm_source=badge&utm_medium=referral&utm_campaign=embed)

## License

MIT — see [LICENSE](LICENSE).

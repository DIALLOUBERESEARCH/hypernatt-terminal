# HyperNatt Terminal

HyperNatt Terminal — agent MCP: multi-crypto liquidation radar + Li.Fi cross-chain swap. Not a generic market-data wrapper — read-only Decision Core context, not trade advice. No custody.

Full HyperNatt platform (vault, assistant, ecosystem): https://hypernatt.com — this MCP is one agent-facing brick.

Security: no custody, no key access, read-only Decision Core, x402 you control, public code — verify yourself (SECURITY.md).

3 tools · v2.7.0 · Streamable HTTP. Call get_agent_manifest first.

Pricing: flat $0.001 per call via x402 (USDC on Base + Solana) on `get_liq_radar`. Free: `get_agent_manifest`. Swap is free at MCP layer (gas + Li.Fi integrator fee on-chain). Heavy use: swap-earned quota or the $5/mo Agent Pass (~15,000 credits).

Whitelist for `get_liq_radar`: **BTC ETH SOL BNB XRP HYPE ZEC** (omit `symbol` = BTC).

Humans: Claude → Settings → Integrations → Add connector → MCP URL on the domain above (/mcp/protocol), then ask: "Call get_agent_manifest, then get_liq_radar — what is the liq context?"

Documentation: github.com/DIALLOUBE-RESEARCH/hypernatt-terminal

---

## Try it in 30 seconds (no install, no wallet)

One free public call returns the catalog (3 tools, prices, ecosystem links):

```bash
curl -s https://hypernatt.com/api/m2m/agent/manifest      # full catalog, free
```

MCP endpoint: https://hypernatt.com/mcp/protocol

---

## Documentation

- [Quickstart](docs/quickstart.md) — connect Claude / Cursor in 30 seconds
- [Integrations](docs/integrations.md) — MCP clients, REST + x402
- [Tool reference](tools/README.md) — per-tool docs
- [Security & trust](SECURITY.md) — no custody, no keys, read-only; verify yourself
- [Glama submission](docs/glama.md)

[![DIALLOUBE-RESEARCH/hypernatt-terminal MCP server](https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal/badges/score.svg)](https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal)

[![HyperNatt Terminal on x402-list](https://x402-list.com/badge/hypernatt-terminal.svg?data=uptime)](https://x402-list.com/services/hypernatt-terminal?utm_source=badge&utm_medium=referral&utm_campaign=embed)

## License

MIT — see [LICENSE](LICENSE).

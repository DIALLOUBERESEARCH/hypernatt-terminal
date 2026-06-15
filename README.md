# HyperNatt Terminal

HyperNatt Terminal — BTC decision context for AI agents from a live Hyperliquid vault (Mimo production stack): MM trap/sweep/reclaim, hunt score, cycle signal, regime similarity, liquidation radar, signed vault proof, and Li.Fi cross-chain swap.

Full HyperNatt platform (vault, assistant, ecosystem): https://hypernatt.com — this MCP is one agent-facing brick. Not a generic market-data wrapper — read-only BTC/USDC context, not trade advice. No custody.

9 tools · v2.5.11 · Streamable HTTP. Call get_agent_manifest first.

Free: manifest, vault proof, swap quotes. Decision Core: 25 shared credits/day plus one intro-free call per tool (about 32/day effective). HOLD on get_btc_usdc_signal is always free. All 5 Decision Core tools cost 1 credit ($0.01) each. Then swap-earned quota, Agent Pass ($19/mo), Pro Pass ($49/mo), or paygo $0.01/credit via x402 (USDC on Base).

Humans: Claude → Settings → Integrations → Add connector → MCP URL on the domain above (/mcp/protocol), then ask: "Call get_vault_proof, then get_mm_trap_state — is the MM trapping?"

Documentation: github.com/DIALLOUBE-RESEARCH/hypernatt-terminal

---

## Try it in 30 seconds (no install, no wallet)

One free public call returns the full catalog (9 tools, prices, ecosystem links):

```bash
curl -s https://hypernatt.com/api/m2m/agent/manifest
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
- [Integrations](docs/integrations.md) — MCP clients, REST + x402, agent frameworks
- [Example responses](docs/example-responses.md) — live JSON samples
- [Tool reference](tools/README.md) — per-tool docs
- [Full technical reference](docs/reference.md) — manifest sections, REST API, Docker, pricing tables
- [Glama submission](docs/glama.md)

[![DIALLOUBE-RESEARCH/hypernatt-terminal MCP server](https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal/badges/score.svg)](https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal)

## License

MIT — see [LICENSE](LICENSE).

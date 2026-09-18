# Examples

| Script | Deps | Purpose |
|--------|------|---------|
| [hyperliquid/read_terrain.py](hyperliquid/read_terrain.py) | None (stdlib) | **HL agent** — read forced-order terrain only (no orders) |
| [liq_radar_min.py](liq_radar_min.py) | None (stdlib) | Free compact manifest — six-tool catalog and journeys |
| [liq_radar_interpret.py](liq_radar_interpret.py) | None (stdlib) | Honest structural read (distance / OI / real liqs) — no fake scores |
| [swap_readiness_check.py](swap_readiness_check.py) | None | Swap onboarding checklist from live manifest |
| [swap_after_liq_radar.py](swap_after_liq_radar.py) | None | **manifest → liq_radar → swap quote** ; `--compare-vault` shows vault blocked |
| [cdp_swap_execute.mjs](cdp_swap_execute.mjs) | `npm install` in this folder | CDP EVM wallet + MCP swap ; `--dry-run` / `--execute` (VPS keys) |

Start with `get_agent_manifest`, then choose the requested journey: liquidation terrain, filmed BTC/ETH native depth, or an independent Li.Fi swap. The swap examples below cover one optional path, not the whole Terminal. See [native-depth.md](../docs/native-depth.md).

Four data tools share the 0.001 USDC/call tariff, eligible credits and daily per-tool/per-token trials. Manifest and MCP swap requests are free; signing a swap incurs separate on-chain costs. See [payment and credits](../docs/x402-pay.md).

## Quick start

```bash
python examples/hyperliquid/read_terrain.py
python examples/liq_radar_min.py
python examples/swap_readiness_check.py
python examples/liq_radar_interpret.py

# Vault blocked demo (prod MCP):
python examples/swap_after_liq_radar.py --compare-vault

# With your agent wallet address (quote only, no sign):
AGENT_WALLET=0xYourWallet python examples/swap_after_liq_radar.py --quote

# CDP on-chain (VPS ~/HYPERNATT/.env):
cd examples && npm install && node cdp_swap_execute.mjs --dry-run
```

Offline checks (no network, payments or signatures): `python -m unittest discover -s examples -p "test_*.py"`.

Guides: [../docs/agent-swap-demo.md](../docs/agent-swap-demo.md) · [../docs/swap-agentkit.md](../docs/swap-agentkit.md)

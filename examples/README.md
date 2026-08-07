# Examples

| Script | Deps | Purpose |
|--------|------|---------|
| [liq_radar_min.py](liq_radar_min.py) | None (stdlib) | Free manifest taste — 3-tool catalog |
| [liq_radar_interpret.py](liq_radar_interpret.py) | None (stdlib) | Honest structural read (distance / OI / real liqs) — no fake scores |
| [swap_readiness_check.py](swap_readiness_check.py) | None | Swap onboarding checklist from live manifest |
| [swap_after_liq_radar.py](swap_after_liq_radar.py) | None | **manifest → liq_radar → swap quote** ; `--compare-vault` shows vault blocked |
| [cdp_swap_execute.mjs](cdp_swap_execute.mjs) | `npm install` in this folder | CDP EVM wallet + MCP swap ; `--dry-run` / `--execute` (VPS keys) |

Official MCP journey: `get_agent_manifest` → `get_liq_radar` → optional `swap_via_nattswap`.

## Quick start

```bash
python examples/liq_radar_min.py
python examples/liq_radar_interpret.py

# Vault blocked demo (prod MCP):
python examples/swap_after_liq_radar.py --compare-vault

# With your agent wallet address (quote only, no sign):
AGENT_WALLET=0xYourWallet python examples/swap_after_liq_radar.py --quote

# CDP on-chain (VPS ~/HYPERNATT/.env):
cd examples && npm install && node cdp_swap_execute.mjs --dry-run
```

Guides: [../docs/agent-swap-demo.md](../docs/agent-swap-demo.md) · [../docs/swap-agentkit.md](../docs/swap-agentkit.md)

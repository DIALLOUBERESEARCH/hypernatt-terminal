# Examples

| Script | Deps | Purpose |
|--------|------|---------|
| [btc_trap_aware_min.py](btc_trap_aware_min.py) | None (stdlib) | Free manifest taste — Decision Core intro |
| [swap_readiness_check.py](swap_readiness_check.py) | None | Swap onboarding checklist from live manifest |
| [swap_after_signal.py](swap_after_signal.py) | None | **Trap/signal read → swap quote** ; `--compare-vault` shows vault blocked |
| [cdp_swap_execute.mjs](cdp_swap_execute.mjs) | `npm install` in this folder | CDP EVM wallet + MCP swap ; `--dry-run` / `--execute` (VPS keys) |

## Quick start

```bash
# Anyone — vault blocked demo (prod MCP):
python examples/swap_after_signal.py --compare-vault

# With your agent wallet address (quote only, no sign):
AGENT_WALLET=0xYourWallet python examples/swap_after_signal.py --quote

# CDP on-chain (VPS ~/HYPERNATT/.env):
cd examples && npm install && node cdp_swap_execute.mjs --dry-run
```

Guides: [../docs/agent-swap-demo.md](../docs/agent-swap-demo.md) · [../docs/swap-agentkit.md](../docs/swap-agentkit.md)

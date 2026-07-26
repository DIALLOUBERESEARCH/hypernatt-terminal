# Agent loop: sticky `get_liq_radar`

Read-only BTC liquidation context for AI agents. **Not trade advice.**

## Why this loop

Production settle telemetry shows `get_liq_radar` as the highest-demand paid Decision Core tool. Sticky agents typically poll raw magnet / OI / cluster data on a short cadence, then cross-read MM trap state before any risk sizing.

## Recommended cadence

1. `get_agent_manifest` (free) — catalog + interpretation rules.
2. `get_liq_radar` ($0.001 via x402, Base or Solana) — magnets, OI, clusters.
3. **Poll `get_liq_radar` every 5–10 minutes** while you monitor liquidation pressure.
4. `get_mm_trap_state` — trap / sweep / reclaim weather before sizing risk.
5. Optional: `get_btc_usdc_signal` / `get_mm_hunt_score` for vault bias and one-line hunt pressure.

See also `agent_interpretation_rules_v1.sticky_liq_loop_v1` on the manifest.

## What this is not

- Not a signal to enter or exit a position.
- Not a substitute for `get_mm_trap_state` when you need sweep/reclaim math.
- Not vault execution — Decision Core is read-only.

## Links

- MCP: `https://hypernatt.com/mcp/protocol`
- Manifest: `GET https://hypernatt.com/api/m2m/agent/manifest`
- Quickstart: [quickstart.md](./quickstart.md)
- Platform: [https://hypernatt.com](https://hypernatt.com)

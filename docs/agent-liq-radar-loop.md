# Agent loop: `get_liq_radar` (optional zoom)

Prefer **`get_trading_hub`** for a one-shot BTC context pack (TA + orderflow + liq both sides + hunt + regime). See [agent-trading-hub.md](agent-trading-hub.md).

Use `get_liq_radar` when you need the **raw** magnet / OI / cluster block only.

## Suggested flow (agent chooses cadence)

1. `get_agent_manifest` (free)
2. `get_trading_hub` ($0.001) — or jump straight to `get_liq_radar` if you only need clusters
3. Cross-read `get_mm_trap_state` before sizing risk
4. Call again **when you decide** context is stale — there is **no mandatory poll interval**

See also `agent_interpretation_rules_v1.trading_hub_loop_v1` / `sticky_liq_loop_v1` on the manifest.

# Agent loop: `get_liq_radar`

Use `get_liq_radar` when you need a **forced-order / liquidation map** (magnet, OI, clusters, real liqs) on a whitelist coin — market structure that classic public indicators do not show.

**This radar-specific journey:** `get_agent_manifest` → `get_liq_radar`. For filmed BTC/ETH size feasibility, see [native-depth.md](native-depth.md). A swap route is optional and independent.

## Suggested flow (agent chooses cadence)

1. `get_agent_manifest` (free) — read `value_proposition_v1`, `use_scenarios_v1`, `glossary_v1`
2. `get_liq_radar` — optional `symbol` among BTC ETH SOL BNB XRP HYPE ZEC (omit = BTC)
3. Interpret **structurally**: `distance_pct`, cluster size, OI Δ, `real_liquidations` — do **not** invent predictive scores
4. Call again **when you decide** context is stale — no mandatory poll interval
5. Optional: `swap_via_nattswap` if you need a Li.Fi route (you sign)

## Honest scenarios (summary)

1. Wait near a dense cluster; reassess after forced flow prints — no guaranteed reversal.
2. Treat distance as a risk parameter for size/patience — not a hit prediction.
3. After real liqs spike, cross-check OI — still context, not an auto entry.

Sample shape: [example-responses.md](example-responses.md)  
Interpret helper: [../examples/liq_radar_interpret.py](../examples/liq_radar_interpret.py)

The compact manifest has `value_proposition_v1`, `use_scenarios_v1` and `glossary_v1`. With `detail=full`, radar guidance is under `agent_interpretation_rules_v1` (`GET https://hypernatt.com/api/m2m/agent/manifest?detail=full`).

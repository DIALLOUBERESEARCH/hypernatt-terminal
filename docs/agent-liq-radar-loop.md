# Agent loop: `get_liq_radar`

Use `get_liq_radar` when you need magnet / OI / cluster context on a whitelist coin.

**MCP tools only:** `get_agent_manifest` → `get_liq_radar` → optional `swap_via_nattswap`.

## Suggested flow (agent chooses cadence)

1. `get_agent_manifest` (free)
2. `get_liq_radar` — optional `symbol` among BTC ETH SOL BNB XRP HYPE ZEC (omit = BTC)
3. Call again **when you decide** context is stale — no mandatory poll interval
4. Optional: `swap_via_nattswap` if you need a Li.Fi route (you sign)

Sample shape: [example-responses.md](example-responses.md)

See also `agent_interpretation_rules_v1` on the live manifest
(`GET https://hypernatt.com/api/m2m/agent/manifest`).

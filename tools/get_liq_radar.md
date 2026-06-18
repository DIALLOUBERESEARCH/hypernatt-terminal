# `get_liq_radar`

Raw BTC **liquidation radar** snapshot: magnet score, OI build-up, long/short ratio, liquidation clusters above/below price, and real liquidations (1h/24h).

The **commodity microstructure layer** behind `get_mm_hunt_score` and `get_mm_trap_state` — clusters and OI blocks, not manipulation verdicts.

For pro workflows, prefer **`get_mm_trap_state`** (trap/sweep/reclaim weather) and **`get_mm_hunt_score`** (one-line summary). Use liq radar when you need the full upstream block.

## Price

| Tier | Cost |
|------|------|
| **Credits** | **1** |
| **Free** | first call per tool is free (intro); no daily credit pool |
| **Pass** | **$5/mo** Agent Pass (~15,000 credits, ~67% below paygo) |
| **Paygo** | **$0.001 USDC** / call via **x402** on **Base** (`eip155:8453`) |

Paywall order: intro-free → swap-earned quota → Agent Pass $5/mo → paygo $0.001.

## When to use

| Situation | Call |
|-----------|------|
| Need trap/sweep/reclaim verdicts | `get_mm_trap_state` (flagship) |
| One-line hunt pressure | `get_mm_hunt_score` |
| Raw clusters, OI, magnet, L/S | **`get_liq_radar`** |
| Vault cycle bias | `get_btc_usdc_signal` |

**Suggested stack:** trap → signal → hunt → *(optional)* liq radar for raw blocks.

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x_payment` | string | No* | Base64 x402 payment payload. Omit first to get payment instructions. |
| `agent_wallet` | string | No | Wallet with quota balance (bypass x402 when covered). |

\* The first call per tool is free (intro), no wallet needed.

## Outputs

On success:

- Product `hypernatt_liq_radar_v1` with `liq_radar` block
- Magnet score, OI build-up, L/S ratio, cluster levels, recent liquidations
- **Redacted** — no internal HLP vault leak
- Read-only market context — **not** a trade signal

## Example fields (abbreviated)

```json
{
  "ok": true,
  "product": "hypernatt_liq_radar_v1",
  "pair": "BTC/USDC",
  "liq_radar": {
    "magnet_score": -28,
    "magnet_bias": "BEARISH_MAGNET",
    "oi_buildup": "RISING",
    "long_short_ratio": 1.12,
    "clusters_above": [{ "price": 58200, "size_usd": 4500000 }],
    "clusters_below": [{ "price": 56800, "size_usd": 6200000 }]
  },
  "disclaimer": "Read-only microstructure. Not a trade recommendation."
}
```

## Compare to flagship tools

| Tool | What you get |
|------|----------------|
| `get_mm_trap_state` | MM_TRAP_ACTIVE, sweep zone, chart_verdicts |
| `get_mm_hunt_score` | `mm_hunt_score`, alert_level, pressure_direction |
| `get_liq_radar` | Raw radar JSON — commodity layer |

## Try it

```bash
curl -sS https://hypernatt.com/api/m2m/liq-radar \
  | jq '.liq_radar.magnet_score, .liq_radar.magnet_bias'
```

MCP: `tools/call` → `get_liq_radar` on `https://hypernatt.com/mcp/protocol`

HTTP mirror: `GET https://hypernatt.com/api/m2m/liq-radar`

More examples: [../docs/example-responses.md](../docs/example-responses.md)

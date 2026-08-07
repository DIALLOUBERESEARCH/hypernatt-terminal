# `get_liq_radar`

Multi-crypto **liquidation radar** snapshot: magnet score, OI build-up, long/short ratio, liquidation clusters above/below price, and recent liquidations.

Product: `hypernatt_liq_radar_v2`. Clusters expose `largest_*_cluster` (size leaders within ±10% of mark); `nearest_*_cluster` is a temporary alias for older clients.

## Price

| Tier | Cost |
|------|------|
| **Credits** | **1** |
| **Paygo** | **$0.001 USDC** / call via **x402** on **Base** + **Solana** |
| **Pass / quota** | Agent Pass $5/mo or swap-earned quota |

## Symbols

Optional `symbol` (HL coin or `*USDT`). Supported: **BTC ETH SOL BNB XRP HYPE ZEC**.  
Omit → **BTC** (whale-compatible default). Other symbols → `symbol_not_supported`.

## When to use

| Situation | Call |
|-----------|------|
| Need liq / OI / cluster context on a whitelist coin | **`get_liq_radar`** |
| Start / catalog | `get_agent_manifest` (free) |
| Cross-chain route | `swap_via_nattswap` |

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | string | No | BTC ETH SOL BNB XRP HYPE ZEC (default BTC) |
| `x_payment` | string | No* | Base64 x402 payment payload |
| `agent_wallet` | string | No | Wallet with quota balance |

## Outputs

- `product`: `hypernatt_liq_radar_v2`
- `symbol` / `binance_symbol` / `provenance`
- `liq_radar` block (redacted — no HLP vault leak)
- Read-only market context — **not** a trade signal

## Try it

```bash
# After x402 payment / quota — public path
curl -sS "https://hypernatt.com/api/m2m/liq-radar?symbol=ETH"
```

MCP: `tools/call` → `get_liq_radar` on `https://hypernatt.com/mcp/protocol`

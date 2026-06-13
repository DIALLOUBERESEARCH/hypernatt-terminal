# `get_btc_usdc_signal`

Live **Mimo BTC/USDC vault cycle** from Hyperliquid — direction, legs, and verifiable on-chain context.

Answers: *What is the live vault doing right now? LONG, SHORT, or HOLD?*

Backed by a **public vault with depositors** since **2026-02-27** — not a synthetic indicator feed.

## Price

| Tier | Cost |
|------|------|
| **Credits** | **1** (shared daily pool) |
| **HOLD verdict** | **Free** — `direction: HOLD` never consumes credits |
| **Free tier** | 10 credits/day across all Decision Core tools |
| **Paygo** | **$0.01 USDC** / credit via **x402** on **Base** (`eip155:8453`) |

## When to use

| Situation | Call |
|-----------|------|
| Align with live vault bias | `get_btc_usdc_signal` |
| MM trap / sweep context first | `get_mm_trap_state` |
| Compressed hunt narrative | `get_mm_hunt_score` |

**Suggested stack:** trap → **signal** → hunt.

## Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x_payment` | string | No* | Base64 x402 payment payload. Omit first to get payment instructions. |
| `agent_wallet` | string | No | Wallet with quota balance (bypass x402 when covered). |

\* HOLD responses are always free. MCP free tier may cover non-HOLD calls.

## Example response (production)

```json
{
  "ok": true,
  "product": "hypernatt_mimo_cycle_state_v1",
  "pair": "BTC/USDC",
  "timeframe": "15m",
  "issued_at": "2026-06-13T13:42:22.315Z",
  "vault_wallet_redacted": "0x04e2…a6d8",
  "has_active": true,
  "cycle": {
    "cycle_id": "C94D4BB60",
    "direction": "LONG",
    "total_legs": 4,
    "max_legs": 4,
    "avg_entry_price": 66715.06,
    "started_at": "2026-06-01T00:45:14.502990+00:00"
  },
  "disclaimer": "Live verifiable Mimo cycle state only. Not a trade recommendation."
}
```

Full payloads include per-leg entries and rich `market_at_entry` blocks.

## Field guide

| Field | Meaning |
|-------|---------|
| `cycle.direction` | **LONG** / **SHORT** / **HOLD** — active vault bias |
| `cycle.cycle_id` | Live cycle identifier |
| `cycle.total_legs` | DLA legs in current cycle (max 4) |
| `cycle.avg_entry_price` | Weighted average entry |
| `vault_wallet_redacted` | Public vault address (redacted) for verification |

## Verify on-chain

| Resource | URL |
|----------|-----|
| Hyperliquid vault | https://app.hyperliquid.xyz/vaults/0x04e2eb302fe9ff23a9d1f2455084af624737a6d8 |
| Public track record | https://hypernatt.com/stats |

## Try it

```bash
curl -sS https://hypernatt.com/api/m2m/signal \
  | jq '.cycle.direction, .cycle.cycle_id, .cycle.total_legs, .vault_wallet_redacted'
```

MCP: `tools/call` → `get_btc_usdc_signal` on `https://hypernatt.com/mcp/protocol`

HTTP mirror: `GET https://hypernatt.com/api/m2m/signal`

More examples: [../docs/example-responses.md](../docs/example-responses.md)

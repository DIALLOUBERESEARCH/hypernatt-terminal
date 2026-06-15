# `get_btc_usdc_signal`

Live **Mimo BTC/USDC vault cycle** from Hyperliquid — direction, legs, and verifiable on-chain context.

Answers: *What is the live vault doing right now? LONG, SHORT, or HOLD?*

Backed by a **public vault with depositors** since **2026-02-27** — not a synthetic indicator feed.

## Price

| Tier | Cost |
|------|------|
| **Credits** | **1** (shared daily pool) |
| **HOLD verdict** | **Free** — `direction: HOLD` never consumes credits |
| **Free tier** | 25 shared pool/day + 1st call free per tool (about 32 effective/day) |
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

## Example response (summary v2 — default MCP)

```json
{
  "ok": true,
  "product": "hypernatt_mimo_cycle_state_v1",
  "pair": "BTC/USDC",
  "has_active": true,
  "issued_at": "2026-06-13T13:42:22.315Z",
  "direction": "LONG",
  "cycle_id": "C94D4BB60",
  "total_legs": 4,
  "chain_snapshot": {
    "entry_price": 63098.9,
    "size": 0.06768,
    "leverage": 5,
    "unrealized_pnl_pct": 1.8,
    "unrealized_pnl_usd": 15.40,
    "liquidation_price": 51214.35,
    "position_tp_observed": 75000
  },
  "checkpoint_snapshot": {
    "last_action": "HOLD",
    "last_confidence": 100,
    "mfe_pct": 2.3,
    "max_drawdown_pct": -3.37
  },
  "position_accounting": {
    "avg_entry_price": 66715.06,
    "initial_entry": 73934
  },
  "interpretation_contract_v1": { "version": "1" },
  "disclaimer": "Live verifiable Mimo cycle state only. Not a trade recommendation."
}
```

**PnL rule:** use `chain_snapshot.unrealized_pnl_pct` for open PnL — not `avg_entry_price` vs spot.

Pass `full_payload: true` for per-leg entries and full OpenViking checkpoint text.

## Example response (legacy shape — pre v2)

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

## Field guide

| Field | Meaning |
|-------|---------|
| `direction` / `cycle_id` | Active vault bias and cycle id |
| `chain_snapshot` | HL position entry, open PnL (authority for unrealized %) |
| `checkpoint_snapshot` | Last session decision (e.g. HOLD) + MFE/DD |
| `position_accounting.avg_entry_price` | Leg-weighted average — not open PnL authority |
| `interpretation_contract_v1` | Agent guardrails — read before narrating |

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

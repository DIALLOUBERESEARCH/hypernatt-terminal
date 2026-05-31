# `get_natt_performance`

Free live trading performance for the **Natt CDP agent** on Base — aggregated from episodic `trade_decision` memory and on-chain wallet balances.

## Price

**Free** (no x402)

## Role

Live trading performance of Natt, our reference agent — PnL, winrate, APR, verifiable on-chain.

## Inputs

None.

## Outputs (summary)

| Field | Description |
|-------|-------------|
| `initial_capital_usdc` | Baseline capital (first deposit / first executed swap) |
| `current_capital_usdc` | USDC + cbBTC mark-to-market |
| `pnl_usdc` / `pnl_pct` | Realized PnL |
| `win_rate_pct` | Round-trip win rate (%) |
| `estimated_apr_pct` | Simple annualization of PnL % |
| `executed_trades_total` | BUY + SELL with on-chain tx |
| `signal_cost_usdc` | Total x402 signal spend |
| `last_trade` | Latest executed trade (ts, type, amount, tx_hash, BaseScan) |
| `wallet_basescan_url` | Verify balances on BaseScan |

When no trade has executed yet: `"message": "Waiting for first trade"` with zeroed metrics.

## Example — MCP

```http
POST https://hypernatt.com/mcp/protocol
Content-Type: application/json

{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_natt_performance","arguments":{}}}
```

## Verify on-chain

- Natt agent wallet link is included in the payload (`wallet_basescan_url`).
- Each trade `tx_hash` can be checked on [BaseScan](https://basescan.org).

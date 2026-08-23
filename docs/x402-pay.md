# x402 payment — Base vs Solana

`get_liq_radar` is **$0.001 USDC exact** on **two rails**. Pick **one** entry from the 402 `accepts[]`. Do not mix them.

| Rail | `network` in 402 | What the buyer signs |
|------|------------------|----------------------|
| **Base** | `eip155:8453` | EIP-3009 authorization (EVM). `@x402/evm` / typical Node x402 fetch clients. |
| **Solana** | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` | Partially signed SPL `TransferChecked`. **`@x402/svm` (or equivalent).** |

## Solana is not “Base with another chain id”

An EVM x402 client that works on Base **cannot** pay Solana. SVM `exact` requires:

1. `feePayer` = `extra.feePayer` from **this** 402 (CDP sponsors gas — not your pubkey).
2. Amount **exactly** `accepts[].amount` (atomic `1000` = $0.001 USDC, 6 decimals).
3. USDC mint = `accepts[].asset` (`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`).
4. Destination = `accepts[].payTo` (HyperNatt Solana treasury).

If CDP returns `invalid_exact_svm_*`, `preflight_validation_failed`, or `invalid_network`, the **transaction body** is wrong — not the 402 challenge. Retry with `@x402/svm` against the live 402, or pay the **Base** accept instead.

## Probe

```bash
curl -i https://hypernatt.com/api/m2m/liq-radar
```

Read `accepts[]`. Pay one rail. Retry with `X-PAYMENT`.

Public MCP: `https://hypernatt.com/mcp/protocol` — call `get_agent_manifest` first.

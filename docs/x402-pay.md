# x402 payment — Base vs Solana

`get_liq_radar` is **$0.001 USDC exact** on **two rails**. Pick **one** entry from the 402 `accepts[]`. Do not mix them.

**Solana rail is live.** First SVM settle on this endpoint: 2026-08-29 UTC
([solscan](https://solscan.io/tx/42WDNoZ9sLdrHnSBYeSr9ZDLiLJpzwx2kgR6WWYSFsXQMm1AbvhBLrzMkwi22BzagLteKoWN3gDr9Skf1UVBaDi5)).
A Base HTTP 200 is **not** a Solana payment.

| Rail | `network` in 402 | What the buyer signs |
|------|------------------|----------------------|
| **Base** | `eip155:8453` | EIP-3009 authorization (EVM). `@x402/evm` / typical Node x402 fetch clients. |
| **Solana** | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` | Partially signed SPL `TransferChecked`. **`@x402/svm` (or equivalent).** |

## Solana is not "Base with another chain id"

An EVM x402 client that works on Base **cannot** pay Solana. SVM `exact` requires:

1. `feePayer` = `extra.feePayer` from **this** 402 (CDP sponsors gas — not your pubkey).
2. Amount **exactly** `accepts[].amount` (atomic `1000` = $0.001 USDC, 6 decimals).
3. USDC mint = `accepts[].asset` (`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`). Put the same value on the payment payload as `accepted.asset` (CDP v2). If omitted, the seller fills it from this 402; still send it.
4. Destination = `accepts[].payTo` (HyperNatt Solana treasury).

If you only have an EVM wallet (or no `@x402/svm`), pick **`accepts[0]` Base**. Do not retry Base after a Solana sign failure and call that a Solana payment.

Solana payments embed a recent blockhash. From 402 received to settle you have about **90 seconds**. Sign in the same process. A payload that sat in a queue will fail `simulation_failed` / `BlockhashNotFound`.

If CDP returns `invalid_exact_svm_*`, `preflight_validation_failed`, `x402V2PaymentRequirements requires 'asset'`, or `invalid_network`, the **payload** is wrong - not the 402 challenge. Rebuild with `@x402/svm` against the live 402. Keep `accepted.network` starting with `solana`.

## Probe

```bash
curl -i https://hypernatt.com/api/m2m/liq-radar
```

Read `accepts[]`. Pay one rail. Retry with `X-Payment` **or** `PAYMENT-SIGNATURE` (base64 JSON payload).

Public MCP: `https://hypernatt.com/mcp/protocol` — call `get_agent_manifest` first.

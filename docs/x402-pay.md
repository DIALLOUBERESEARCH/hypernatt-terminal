# x402 payment — Base vs Solana

`get_liq_radar` is **$0.001 USDC exact** on **two rails**. Pick **one** entry from the 402 `accepts[]`. Do not mix them.

**Solana rail is live and verified on REST and MCP:**
- **REST settle:** [36FvuTpq...](https://solscan.io/tx/36FvuTpqWiSoDLrs2xVRecehCmArdqptDXB8sHTfvJQSUCs7GY7CLhHwGHYwT4eXqqcgkroYheFcy5ajrUgdJLSg) (2026-09-05 UTC, slot 444415694)
- **MCP Streamable HTTP (`x_payment`) settle:** [5g4JePDX...](https://solscan.io/tx/5g4JePDXuqwViz7noAiPhXJTQmQNUAdYifLM417uMt79q5Y3LkL8KDW1rUB1aX8EbfagU2AXPXQvSQtgStqjAi11) (2026-09-05 UTC, slot 444416162)
- Historic first settle: [42WDNoZ9...](https://solscan.io/tx/42WDNoZ9sLdrHnSBYeSr9ZDLiLJpzwx2kgR6WWYSFsXQMm1AbvhBLrzMkwi22BzagLteKoWN3gDr9Skf1UVBaDi5) (2026-08-29 UTC).

A Base HTTP 200 is **not** a Solana payment.

| Rail | `network` in 402 | What the buyer signs |
|------|------------------|----------------------|
| **Base** | `eip155:8453` | EIP-3009 authorization (EVM). `@x402/evm` / typical Node x402 fetch clients. |
| **Solana** | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` | Partially signed SPL `TransferChecked`. **`@x402/svm` (or equivalent).** |

## Solana is not "Base with another chain id"

An EVM x402 client that works on Base **cannot** pay Solana. SVM `exact` requires:

1. **Single `TransferChecked` instruction**: client partially signs a transfer of SPL USDC from their associated token account (ATA) to the seller treasury.
2. `feePayer` = `extra.feePayer` from **this** 402 (CDP sponsors gas — not your pubkey).
3. Amount **strictly atomic `1000`** ($0.001 USDC, 6 decimals). (Human-readable `"0.001"` is accepted via backward-compatible coercion, but atomic integer string is standard).
4. USDC mint = `accepts[].asset` (`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`). Put the same value on the payment payload as `accepted.asset` (CDP v2).
5. Destination = `accepts[].payTo` (HyperNatt Solana treasury: `2hAXt3sb2GZrtXx4ae4Ywc7enqrE191nktyL5k2nWSfg`).
6. Network format: CAIP-2 (`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`) or legacy v1 alias (`solana`, `solana-mainnet`) accepted and auto-mapped.
7. **Immediate signature**: Solana payments embed a recent blockhash (~90 seconds lifespan). Sign and transmit in the same execution cycle. Stale blockhashes fail `BlockhashNotFound`.

If you only have an EVM wallet (or no `@x402/svm`), pick **`accepts[0]` Base**. Do not retry Base after a Solana sign failure and call that a Solana payment.

If CDP returns `invalid_exact_svm_*`, `preflight_validation_failed`, `x402V2PaymentRequirements requires 'asset'`, or `invalid_network`, the **payload** is wrong — not the 402 challenge. Rebuild with `@x402/svm` against the live 402. Keep `accepted.network` starting with `solana`.

## Probe

```bash
curl -i https://hypernatt.com/api/m2m/liq-radar
```

Read `accepts[]`. Pay one rail. Retry with `X-Payment` **or** `PAYMENT-SIGNATURE` (base64 JSON payload).

Public MCP: `https://hypernatt.com/mcp/protocol` — call `get_agent_manifest` first, then call `get_liq_radar` with argument `x_payment`.

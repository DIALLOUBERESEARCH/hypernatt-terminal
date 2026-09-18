# NattSwap — Agent wallet execution guide

How to go from **quote** to **on-chain swap** to **quota credits**. HyperNatt does
not custody your keys. You sign every transaction.

MCP v2.8.0 — the only swap MCP tool is **`swap_via_nattswap`**.

## Why this doc exists

Radar, order quotes, snapshot comparisons and fill reconciliation are **read-only data tools** at 0.001 USDC or one eligible credit per call after their daily trials. [Payments on Base or Solana](x402-pay.md) are separate from swap execution.

NattSwap is **execution**: you need a wallet that signs on the **source chain**,
native gas, token balance, then optional registration for credits.

Agents often paste **public addresses** they cannot sign. Quotes succeed but
**broadcast fails**.

## Prerequisites checklist

| Requirement | Notes |
|-------------|--------|
| Hot wallet you control | CDP AgentKit, viem `WalletClient`, ethers signer |
| `fromAddress` = signer | Wallet that signs the source-chain swap; for paid HTTP quotes, also check the returned `payer_wallet` mismatch rule |
| Gas on source chain | x402 USDC on Base does **not** pay Ethereum/Arbitrum gas |
| `fromToken` balance | On the source chain |
| `execution_readiness.can_execute` | Must be `true` before broadcast |

## Surfaces (pick one)

| Surface | Cost | Best for |
|---------|------|----------|
| MCP `swap_via_nattswap` | Free at API layer | Agents with MCP + signer |
| HTTP `GET /api/m2m/swap/quote` | $0.001 x402 | REST / x402-list crawlers (optional; **not** an MCP tool) |

**Recommendation:** use **`swap_via_nattswap`** — quote plus `instructions`,
`execution_readiness`, and `swap_execution_playbook_v1`.

## Step-by-step (MCP)

1. **Load full manifest** — `get_agent_manifest` with `{"detail":"full"}` → find `sections[]` entry with `name: "Execution"`, then read `wallet_onboarding_v1`.
2. **Wallet** — create or load your agent wallet (CDP AgentKit docs).
3. **Quote** — `swap_via_nattswap` with:
   - `fromAddress` / `toAddress` = your wallets
   - `fromChain`, `toChain`, tokens, `fromAmount` (atomic units)
4. **Readiness** — if `execution_readiness.can_execute` is `false`, fix `blockers` first.
5. Prefer **`swap_actions_v1`** — sign `actions` in order (`approve` then `swap`).
   Fallback: approve Li.Fi Diamond then broadcast `transactionRequest`.
6. **Poll** — `GET /api/m2m/swap/status/:txHash?fromChain=...` (bridges: 1–30 min).
7. **Register** — use `register_hint` from `swap_actions_v1` or `POST /api/m2m/swap/register`.
8. **Quota** — `GET /api/m2m/quota/status?wallet=0xYourWallet` for eligible shared credits covering radar and native depth.

## Coinbase CDP / x402 buyer wallet

### Pay for forced-order map (`get_liq_radar`)

```text
GET https://hypernatt.com/api/m2m/liq-radar?symbol=BTC
→ 200 JSON terrain  OR  402 x402 challenge
→ pay USDC (Base or Solana) → retry with X-PAYMENT
```

```bash
curl -i "https://hypernatt.com/api/m2m/liq-radar?symbol=BTC"
```

Wire any CDP / AgentKit x402 **buyer** to that URL. Reference:
[AgentKit](https://docs.cdp.coinbase.com/agentkit/docs/welcome) ·
[x402](https://docs.cdp.coinbase.com/x402/welcome) ·
wallet MCP: `npx @coinbase/payments-mcp`

This pays **reads only**. It does **not** place Hyperliquid orders.

### API payer versus swap signer

MCP `swap_via_nattswap` is free and does not require a payer from an earlier radar call. Use the wallet that will sign the source-chain transaction as `fromAddress`.

For a paid HTTP swap quote, when `execution_readiness.payer_wallet` contains an EVM payer, the current readiness check requires it to match `fromAddress`. A Solana payment wallet is not an EVM source-chain signer. Follow the returned blockers and use a valid source-chain signing wallet. For Ethereum → Base bridges, fund ETH gas on Ethereum separately.

Discovery listing checklist: [cdp-bazaar-checklist.md](cdp-bazaar-checklist.md)

## Common mistakes

| Mistake | Fix |
|---------|-----|
| `fromAddress` = third-party vault | Use your agent wallet |
| HTTP quote reports EVM payer/fromAddress mismatch | Align the quote's EVM payer and signer, or use free MCP routing with your actual signer |
| Broadcast with `can_execute: false` | Read `blockers` and `swap_execution_playbook_v1` |
| Expect x402 USDC to pay swap gas | Gas is native on source chain |

## Example register body

```json
{
  "agentAddress": "0xYourAgentWallet",
  "txHash": "0x...",
  "fromChain": 8453,
  "toChain": 8453,
  "volumeUSD": 10.5
}
```

`fromChain`, `toChain`, and `volumeUSD` are optional — Li.Fi resolution fills them when omitted.

## Related

- [`swap_via_nattswap.md`](../tools/swap_via_nattswap.md)
- [`integrations.md`](integrations.md)
- Manifest: `GET https://hypernatt.com/api/m2m/agent/manifest`

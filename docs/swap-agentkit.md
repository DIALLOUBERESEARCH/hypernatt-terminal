# NattSwap — Agent wallet execution guide

How to go from **quote** to **on-chain swap** to **quota credits**. HyperNatt does
not custody your keys. You sign every transaction.

## Why this doc exists

Decision Core tools (`get_liq_radar`, `get_mm_trap_state`, …) are **read-only**:
pay $0.001 x402 on Base → JSON back. Done.

NattSwap is **execution**: you need a wallet that signs on the **source chain**,
native gas, token balance, then optional registration for credits.

Agents often paste **public addresses** (Hyperliquid vault from `get_vault_proof`,
exchange cold wallets). Quotes succeed but **you cannot sign** those txs.

## Prerequisites checklist

| Requirement | Notes |
|-------------|--------|
| Hot wallet you control | CDP AgentKit, viem `WalletClient`, ethers signer |
| `fromAddress` = signer | Same wallet that pays x402 when swapping from Base |
| Gas on source chain | x402 USDC on Base does **not** pay Ethereum/Arbitrum gas |
| `fromToken` balance | On the source chain |
| `execution_readiness.can_execute` | Must be `true` before broadcast |

## Surfaces (pick one)

| Surface | Cost | Best for |
|---------|------|----------|
| MCP `swap_via_nattswap` | Free at API layer | Agents with MCP + signer |
| MCP `swap_quote` | Free | Raw Li.Fi JSON |
| HTTP `GET /api/m2m/swap/quote` | $0.001 x402 | REST / x402-list crawlers |

**Recommendation:** use **`swap_via_nattswap`** — same quote plus `instructions`,
`execution_readiness`, and `swap_execution_playbook_v1`.

## Step-by-step (MCP)

1. **Load manifest** — `get_agent_manifest` → read `sections.Execution.wallet_onboarding_v1`.
2. **Wallet** — create or load your agent wallet (CDP AgentKit docs).
3. **Quote** — `swap_via_nattswap` with:
   - `fromAddress` / `toAddress` = your wallets
   - `fromChain`, `toChain`, tokens, `fromAmount` (atomic units)
4. **Readiness** — if `execution_readiness.can_execute` is `false`, fix `blockers` first.
5. **Prefer `swap_actions_v1`** (F#54N) — sign `actions` in order (`approve` then `swap`).
   Fallback: approve Li.Fi Diamond then broadcast `transactionRequest`.
6. **Poll** — `GET /api/m2m/swap/status/:txHash?fromChain=...` (bridges: 1–30 min).
7. **Register** — use `register_hint` from `swap_actions_v1` or `POST /api/m2m/swap/register`.
8. **Quota** — `GET /api/m2m/quota/status` for bonus Decision Core credits.

## Coinbase CDP / x402 buyer wallet

HyperNatt HTTP endpoints accept x402 on **Base + Solana**. If your agent already
pays for `get_liq_radar` via CDP x402:

- Use **that same wallet** as `fromAddress` when swapping **from Base**.
- For **Ethereum → Base** bridges, fund **ETH gas on Ethereum** separately.

Reference: [Coinbase AgentKit](https://docs.cdp.coinbase.com/agentkit/docs/welcome)

## Common mistakes

| Mistake | Fix |
|---------|-----|
| `fromAddress` = vault from `get_vault_proof` | Vault is read-only proof — use your agent wallet |
| Paid x402 with wallet A, `fromAddress` = wallet B | Align payer and signer |
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

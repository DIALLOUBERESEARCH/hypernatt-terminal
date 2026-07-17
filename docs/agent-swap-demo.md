# Agent swap demo — wallet-first path

Minimal recipe for builders who already pay HyperNatt x402 tools but have not executed a NattSwap yet.

**Read-only context is not trade advice. No custody.**

---

## Prerequisites

| Requirement | Why |
|-------------|-----|
| **Agent hot wallet** | CDP Agentic Wallet, AgentKit, or viem `WalletClient` — not the vault from `get_vault_proof` |
| **USDC on Base** | x402 micropayments for Decision Core |
| **Gas on source chain** | Ethereum/Arbitrum/etc. if bridging from there |
| **MCP client** | Claude, Cursor, or Hermes with `https://hypernatt.com/mcp/protocol` |

Optional but recommended: [Coinbase Payments MCP](https://www.coinbase.com/developer-platform/discover/launches/payments-mcp) so the agent has wallet + x402 in one UI.

---

## Step 0 — Check onboarding (no wallet)

```bash
python examples/swap_readiness_check.py
```

Or:

```bash
curl -s https://hypernatt.com/api/m2m/agent/manifest | jq '.sections[] | select(.name=="Execution") | .wallet_onboarding_v1'
```

---

## Step 1 — Connect HyperNatt MCP

```json
{
  "mcpServers": {
    "hypernatt-terminal": {
      "url": "https://hypernatt.com/mcp/protocol",
      "transport": "streamable-http"
    }
  }
}
```

Smithery: `npx -y @smithery/cli@latest mcp add hypernatt/hypernatt-terminal`

---

## Step 2 — Read context (intro-free per tool)

Prompt your agent:

> Call `get_agent_manifest`, then `get_mm_trap_state`, then `get_btc_usdc_signal`. Summarize trap verdict vs vault direction. Do not use vault address as a swap wallet.

---

## Step 3 — Swap with YOUR wallet

Prompt (replace `0xYourAgentWallet`):

> Call `swap_via_nattswap` with:
> - fromChain: 8453 (Base)
> - toChain: 8453
> - fromToken: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (USDC Base)
> - toToken: `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` (cbBTC Base) or USDC on another chain
> - fromAmount: `1000000` (1 USDC, 6 decimals)
> - fromAddress: **0xYourAgentWallet**
> - toAddress: **0xYourAgentWallet**
>
> If `execution_readiness.can_execute` is false, stop and fix blockers. If true, follow `swap_execution_playbook_v1` and sign with my wallet.

Cross-chain example (needs ETH gas on Ethereum):

> fromChain 1, toChain 8453, USDC→USDC, same wallet for from/to.

Full detail: [swap-agentkit.md](swap-agentkit.md)

---

## Step 4 — Register for quota (after on-chain success)

```bash
curl -X POST https://hypernatt.com/api/m2m/swap/register \
  -H "Content-Type: application/json" \
  -d '{
    "agentAddress": "0xYourAgentWallet",
    "txHash": "0x...",
    "fromChain": 8453
  }'
```

Check credits:

```bash
curl -s "https://hypernatt.com/api/m2m/quota/status?wallet=0xYourAgentWallet"
```

---

## Common failure (why quotes spike, swaps stay at zero)

| Mistake | Fix |
|---------|-----|
| `fromAddress` = vault from `get_vault_proof` | Use agent wallet only |
| Paid x402 with wallet A, swap from wallet B | Same wallet for pay + sign on Base |
| No ETH on Ethereum for ETH→Base bridge | Fund gas on source chain |
| Broadcast when `can_execute: false` | Read `blockers` first |

---

## Verify integrator (optional)

Successful swaps via this MCP use Li.Fi integrator `hypernatt.app` (0.5% on execution volume).

---

## Related

- [swap-agentkit.md](swap-agentkit.md)
- [integrations.md](integrations.md)
- [quickstart.md](quickstart.md)

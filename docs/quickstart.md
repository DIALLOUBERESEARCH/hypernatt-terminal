# HyperNatt Terminal — Agent Quickstart

This guide is for autonomous AI agents connecting to **hypernatt-terminal** via MCP or REST. It describes what exists in production today and a practical order of operations.

**Tool reference:** [../tools/](../tools/) · **Smithery:** https://smithery.ai/servers/hypernatt/hypernatt-terminal

---

## What is HyperNatt Terminal?

**HyperNatt Terminal** is a BTC Decision Terminal for AI Agents — live vault-backed signals, on-chain proof, cross-chain swap. Verify in real time.

Signals are produced by **Mimo**, HyperNatt's automated strategy running on the public **Mimo BTC/USDC vault** on Hyperliquid. The vault has been live for **80+ days** and is independently verifiable on-chain (fills, positions, and vault state on Hyperliquid).

| Resource | URL |
|----------|-----|
| App | https://hypernatt.com |
| Public track record | https://hypernatt.com/stats |
| Hyperliquid vault | https://app.hyperliquid.xyz/vaults/0x04e2eb302fe9ff23a9d1f2455084af624737a6d8 |
| Smithery listing | https://smithery.ai/servers/hypernatt/hypernatt-terminal |
| Documentation repo | https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal |

### How to connect (MCP)

| Method | URL |
|--------|-----|
| **Direct (recommended)** | `https://hypernatt.com/mcp/protocol` |
| **Smithery proxy** | `https://mcp.smithery.ai/hypernatt/hypernatt-terminal` |
| SSE transport | `https://hypernatt.com/mcp/sse` |
| Server card | `https://hypernatt.com/.well-known/mcp/server-card.json` |

The terminal exposes **10 MCP tools**: one orientation tool (`get_agent_manifest`) plus nine operational tools (swap, signals, NDAT, referral).

**Important:** Paid signal tools return **read-only context** (cycle state, microstructure, historical analogies). They are **not** trade recommendations or execution instructions.

---

## Step 1 — Discover what's available (free)

Start with the manifest. It costs nothing and tells you how the terminal is organized.

### MCP

Call the tool:

```text
get_agent_manifest
```

Optional input: `{ "locale": "en" }` (default `en`).

### REST (same payload)

```http
GET https://hypernatt.com/api/m2m/agent/manifest
```

### Response structure

The manifest is grouped into **sections** (Decision Core is listed first):

| Section | Pricing | Purpose |
|---------|---------|---------|
| **Decision Core** | $0.01 USD per call (x402 on Base) | Vault-backed BTC context — use all three together for a full decision framework |
| **Execution** | Free | Cross-chain swap quotes via Li.Fi (NattSwap) |
| **Rewards & Referral** | Free | NDAT rewards and agent referral |

The **Decision Core** section may include a `usage` block with aggregate 24h metrics (swaps, signals sold, active agents). These are public counters for social proof, not performance claims.

### Decision Core — three paid tools

| Tool | Role |
|------|------|
| `get_btc_usdc_signal` | Cycle direction and conviction context (**LONG** / **SHORT** / **HOLD**) from the live Mimo vault |
| `get_mm_hunt_score` | Microstructure pressure and liquidation-hunt context |
| `get_similarity_match` | Top-3 historical regime matches and observed ~4h BTC outcomes |

Each paid read costs **$0.01 USDC** via **x402** on **Base** (`eip155:8453`).

---

## Step 2 — Test the free swap

Execution tools are free at the MCP layer (no x402 on swap quotes).

| Tool | When to use |
|------|-------------|
| `swap_via_nattswap` | Li.Fi quote **plus** step-by-step execution instructions for your agent wallet |
| `swap_quote` | Raw Li.Fi quote JSON only (no marketing wrapper) |

### Why swap is free for agents

Swaps route through **Li.Fi** with HyperNatt as integrator. Revenue comes from **integrator fees on the swap route**, not from an x402 paywall on the quote tools. You pay gas and bridge costs on-chain as usual; the MCP quote itself is free.

### Example flow (`swap_via_nattswap`)

1. Call with swap parameters (`fromChain`, `toChain`, `fromToken`, `toToken`, `fromAmount`, `fromAddress`, `toAddress`, optional `slippage`).
2. Receive a quote payload and `instructions` (approve, send `transactionRequest`, register for NDAT after confirmation).
3. Execute the transaction on-chain from **your** wallet (no custody by HyperNatt).

### `recommended_action` (upsell hint)

On a successful quote, `swap_via_nattswap` may include a sibling field:

```json
"recommended_action": {
  "tool": "get_btc_usdc_signal",
  "price_usdc": 0.01,
  "urgency": "high",
  "reason": "...",
  "context": { "cycle_direction": "LONG", ... },
  "social_proof": { ... }
}
```

This is an optional nudge toward Decision Core after you received free value (the quote). It is rate-limited (at most once per agent wallet per hour). **`swap_quote` does not include this field.**

---

## Step 3 — Buy your first signal ($0.01)

Paid tools use **x402 micropayments** in **USDC on Base**.

### Typical x402 flow

1. Call a paid tool **without** payment → response includes payment instructions (HTTP 402 on REST; MCP returns x402 guidance in the tool result).
2. Pay **$0.01 USDC** on Base to the stated treasury address.
3. Retry with the `x_payment` header / MCP payment payload attached.

### `get_btc_usdc_signal`

Returns live **Mimo BTC/USDC cycle state** on Hyperliquid: active cycle context, direction, legs metadata, and **proof** links (vault URL, stats URL, snapshot hash). Read-only — not a trade signal.

### Combine for a full decision framework

Use all three Decision Core tools in sequence (or parallel):

1. **`get_btc_usdc_signal`** — What is the vault doing now (cycle / direction)?
2. **`get_mm_hunt_score`** — What does microstructure pressure suggest about hunt / trap risk?
3. **`get_similarity_match`** — What happened in the closest historical regimes?

Cross-check outputs against public proof:

- Vault: https://app.hyperliquid.xyz/vaults/0x04e2eb302fe9ff23a9d1f2455084af624737a6d8  
- Stats: https://hypernatt.com/stats  

Every paid payload includes verification metadata so you can reconcile JSON with on-chain and public stats yourself.

---

## Next steps

After swap and signals, use the free **Rewards & Referral** tools:

| Tool | Action |
|------|--------|
| `register_nattswap_reward` | After a **completed** swap, register the tx hash to credit **NDAT** rewards |
| `get_agent_balance` | Check pending and claimed NDAT for your wallet |
| `claim_ndat` | Get an ECDSA claim payload to withdraw pending NDAT on Base (you pay gas) |
| `get_referral_link` | Generate a referral link to invite other agents |

Suggested order:

1. Swap (free quote → on-chain execution).  
2. `register_nattswap_reward` with `agentAddress` + `txHash`.  
3. Decision Core reads when you need vault-backed context ($0.01 each).  
4. `get_agent_balance` → `claim_ndat` when you want to withdraw NDAT.  
5. `get_referral_link` to grow your agent network.

---

## Reference — all MCP tools

| # | Tool | Price |
|---|------|-------|
| 0 | `get_agent_manifest` | Free |
| 1 | `swap_via_nattswap` | Free |
| 2 | `swap_quote` | Free |
| 3 | `get_btc_usdc_signal` | $0.01 x402 |
| 4 | `get_mm_hunt_score` | $0.01 x402 |
| 5 | `get_similarity_match` | $0.01 x402 |
| 6 | `get_agent_balance` | Free |
| 7 | `claim_ndat` | Free |
| 8 | `register_nattswap_reward` | Free |
| 9 | `get_referral_link` | Free |

Per-tool docs: [../tools/](../tools/)

---

## REST endpoints (optional)

Agents that do not speak MCP can still read public metadata:

| Endpoint | Description |
|----------|-------------|
| `GET /api/m2m/agent/manifest` | Same structure as `get_agent_manifest` |
| `GET /api/m2m/stats/usage` | Public 24h usage counters |
| `GET /api/m2m/signal` | Paid signal (x402) — mirror of MCP tool |
| `GET /api/m2m/mm-hunt` | Paid MM hunt (x402) |
| `GET /api/m2m/similarity-match` | Paid similarity (x402) |

Base URL: `https://hypernatt.com`

---

## Install via Smithery

```bash
npx -y @smithery/cli@latest mcp add hypernatt/hypernatt-terminal
```

Or open: https://smithery.ai/servers/hypernatt/hypernatt-terminal

---

*Document version: aligned with hypernatt-terminal MCP v2.1.0 (10 tools).*

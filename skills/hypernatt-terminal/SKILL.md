---
name: hypernatt-terminal
description: >-
  Connect HyperNatt Terminal MCP — read-only BTC/USDC decision context from a live
  Hyperliquid vault (MM trap, hunt, cycle signal, liq radar, similarity). Free
  manifest and vault proof; intro-free taste per Decision Core tool; then x402
  $0.001 USDC/call (Base + Solana). Not trade advice. No custody.
version: 1.0.0
author: DIALLOUBE-RESEARCH
license: MIT
metadata:
  hermes:
    tags: [MCP, x402, BTC, hyperliquid, market-microstructure, trading-context]
    related_skills: [native-mcp, mcporter]
---

# HyperNatt Terminal MCP

Production MCP seller for AI agents.

| Resource | URL |
|----------|-----|
| Platform | https://hypernatt.com |
| MCP (streamable-http) | https://hypernatt.com/mcp/protocol |
| MCP SSE | https://hypernatt.com/mcp/sse |
| Server card | https://hypernatt.com/.well-known/mcp/server-card.json |
| Stats / track record | https://hypernatt.com/stats |
| Source | https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal |
| Security | https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/blob/main/SECURITY.md |

**Version:** 9 tools · v2.5.11 · Streamable HTTP.

HyperNatt is the live trading + AI platform. **hypernatt-terminal** is one agent-facing brick — not the whole product.

---

## When to use

Load this skill when the agent needs **read-only BTC/USDC context** from a **live Hyperliquid vault** (Mimo production stack):

- MM trap / sweep / reclaim (`get_mm_trap_state`)
- Cycle direction LONG/SHORT/HOLD (`get_btc_usdc_signal`)
- Microstructure hunt pressure (`get_mm_hunt_score`)
- Historical regime analogy (`get_similarity_match`)
- Liquidation radar (`get_liq_radar`)
- On-chain vault integrity (`get_vault_proof`)

**Do not use** for generic price feeds, trade execution on the vault, or custody. Swaps are advisory — the agent signs its own Li.Fi transaction.

---

## Hermes Agent setup

Add to `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  hypernatt-terminal:
    url: https://hypernatt.com/mcp/protocol
    transport: streamable-http
```

Restart the Hermes gateway or CLI session. MCP tools are discovered at startup and injected into CLI, Discord, Telegram, etc. (requires Hermes MCP toolset enabled — see skill `native-mcp`).

**Install this skill (optional onboarding doc):**

```bash
hermes skills install github/DIALLOUBE-RESEARCH/hypernatt-terminal/skills/hypernatt-terminal
```

---

## OpenClaw / ClawHub / Cursor / Claude

| Client | Setup |
|--------|--------|
| Claude / Cursor / Windsurf | MCP URL `https://hypernatt.com/mcp/protocol` |
| Smithery | `npx -y @smithery/cli@latest mcp add hypernatt/hypernatt-terminal` |
| OpenClaw | MCP URL or install via ClawHub when listed |
| REST (no MCP) | `GET https://hypernatt.com/api/m2m/agent/manifest` (free) |

Full integration guide: [docs/integrations.md](https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/blob/main/docs/integrations.md)

---

## Recommended call order

**Proof first (free):**

1. `get_agent_manifest` — catalog, pricing, security attestation
2. `get_vault_proof` — signed vault snapshot (verify at https://hypernatt.com/stats)

**Default cross-read (Decision Core):**

3. `get_mm_trap_state`
4. `get_btc_usdc_signal`
5. `get_mm_hunt_score`

**Deep dive:**

6. `get_similarity_match` — always state `confidence_tier`; do not treat same-day TOP3 as independent confirmations
7. `get_liq_radar`

**Coherence rule:** Vault HOLD is coherent with bearish MM pressure only while trap `chart_verdicts.hunt` remains `SWEEP_MATH_FAIL`. If hunt flips to `SWEEP_MATH_OK`, re-evaluate — do not cite stale HOLD.

---

## Pricing (honest)

| Tier | Detail |
|------|--------|
| **Always free** | `get_agent_manifest`, `get_vault_proof`, `swap_quote` |
| **Intro free** | First call **per** Decision Core tool (no wallet on MCP session) |
| **HOLD free** | `get_btc_usdc_signal` with HOLD verdict = **0 charge** |
| **Paygo** | **$0.001 USDC** per credit via x402 (Base + Solana) after intro |
| **Agent Pass** | **$5/mo** → ~15,000 credits / 30 days |
| **Swap quota** | NattSwap volume → bonus credits (~20 per $100 swapped) |

Paywall order: intro-free → swap-earned quota → Agent Pass → x402 paygo.

No daily credit pool. `initialize` and `tools/list` must stay free (standard MCP discovery).

---

## Tool surface (9 tools)

| Tool | Credits | Notes |
|------|---------|-------|
| `get_agent_manifest` | Free | Call first |
| `get_vault_proof` | Free | On-chain proof |
| `get_mm_trap_state` | 1 | Flagship trap/sweep/reclaim |
| `get_btc_usdc_signal` | 1 | HOLD not charged |
| `get_mm_hunt_score` | 1 | Hunt pressure |
| `get_similarity_match` | 1 | Regime analogy |
| `get_liq_radar` | 1 | Liq clusters |
| `swap_quote` | Free | Quote only — read `execution_readiness` |
| `swap_via_nattswap` | Free | Agent signs own tx; 0.5% fee on execution |

**Swap execution:** read `sections.Execution.wallet_onboarding_v1` in manifest and
[docs/swap-agentkit.md](https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/blob/main/docs/swap-agentkit.md).
Never use `get_vault_proof.vault_address` as `fromAddress`.

Per-tool docs: https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/tree/main/tools

---

## Security and limits

- **No custody.** No wallet key access. Read-only Decision Core.
- **Not trade advice.** Context only — verify on-chain before trusting.
- **x402:** User-controlled micropayments; agent wallet must hold USDC on Base or Solana.
- **Not certified.** Read SECURITY.md and verify yourself.

HyperNatt has **no official X/Twitter account** and no ICO/presale/airdrop.

---

## Zero-setup smoke test (no wallet)

```bash
curl -s https://hypernatt.com/api/m2m/agent/manifest
curl -s https://hypernatt.com/api/m2m/mm-trap-state
```

First REST call per Decision Core tool is intro-free; subsequent calls return HTTP 402 with x402 payment instructions.

---

## Example first prompt (humans or agents)

> Call get_agent_manifest, then get_mm_trap_state, then get_btc_usdc_signal from HyperNatt — is vault HOLD coherent with trap verdicts?

# HyperNatt Terminal

[![CI](https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/actions/workflows/ci.yml/badge.svg)](https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/actions/workflows/ci.yml)
[![Glama](https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal/badges/score.svg)](https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal)
[![x402-list](https://x402-list.com/badge/hypernatt-terminal.svg?data=uptime)](https://x402-list.com/services/hypernatt-terminal?utm_source=badge&utm_medium=referral&utm_campaign=embed)
[![Version](https://img.shields.io/badge/version-2.8.0-green)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](./LICENSE)
[![npm audit](https://img.shields.io/badge/npm%20audit-0%20high-brightgreen)](./CHANGELOG.md)

**Liquidation radar and Hyperliquid execution context** for AI agents + **Li.Fi** cross-chain swap. Pay-per-call via x402.

Understand **liquidation terrain**, estimate **execution costs for your order size**, compare conditions with your last check, and reconcile your own fills afterwards. For cross-chain swaps, request a **Li.Fi route** that your agent signs. Your agent chooses the task and controls execution.

Built by one person. Code is public. Backend is private. No custody. Not trade advice.

Full HyperNatt platform (vault, assistant): https://hypernatt.com — this repo is one agent-facing brick.

> Public runtime and docs are synced from the monorepo. Repository: https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal.

## Quick start (30 seconds)

No install for the hosted MCP. In **Claude → Settings → Connectors → Add custom connector**:

| Field | Value |
|-------|-------|
| Name | HyperNatt Terminal |
| URL | `https://hypernatt.com/mcp/protocol` |

Then ask:

> Call get_agent_manifest and choose journeys_v1 for my task. For an ETH buy of 0.1 ETH, estimate execution costs with get_execution_quote. Keep the baseline so we can compare later and reconcile my own fills after execution.

More clients (Cursor / Cline / Codex / Windsurf): [docs/integrations.md](docs/integrations.md).

## What HyperNatt Terminal gives your agent

Start with **`get_agent_manifest`** (free), then choose the tools your task needs through `journeys_v1`:

- **Understand the market:** `get_liq_radar` provides liquidation clusters, open-interest context and observed liquidations.
- **Assess a Hyperliquid perpetual order:** `get_execution_quote` estimates its visible execution conditions; `compare_execution_context` measures changes since a saved check; `reconcile_execution` compares your supplied fills with your pre-order estimate.
- **Find a cross-chain swap route:** `swap_via_nattswap` requests a Li.Fi route for your source/destination chains and tokens. Your agent signs the transaction.

Radar and execution context support **BTC, ETH, SOL, BNB, XRP, HYPE and ZEC**. Cross-chain swaps use the chains and tokens supported by Li.Fi, subject to route availability; they are not limited to those seven symbols. The radar is optional for the execution-cost workflow.

## Liquidation terrain — `get_liq_radar`

A map of **forced orders**: where leveraged positions will be liquidated if price reaches them (clusters, OI build-up, observed liquidations).

This is **market structure context**, not a trade signal. It shows terrain so a sovereign trading agent can judge timing, sizing, and risk with more awareness than agents that only read RSI/MACD-style public feeds.

Your agent still decides. We show the terrain.

### Radar scenarios

#### Scenario 1 — Ignore noise; wait only near class=true

Ignore clusters with `class=noise` (distance < 3%). If `cluster_grammar` is present, wait only near `class=true` (low-leverage stack ~7%+). Then watch `real_liquidations` print — **without** assuming a guaranteed reversal. `class=true` is terrain, not an entry signal.

#### Scenario 2 — Size relative to distance

Cluster ~5% away vs ~0.5% away is a different risk parameter. Distance informs sizing or patience — it is **not** a prediction that the level will be hit.

#### Scenario 3 — After real liquidations, check OI

If price swept a zone and real liquidations spiked, compare with OI change. A large OI drop can mean forced flow is partly exhausted — still context, **not** an auto entry.

### Radar glossary

| Term | Meaning |
|------|---------|
| Cluster | Zone where leveraged positions may liquidate if mark reaches it. Not a TP. |
| `cluster_grammar` / `class` | If present: **read this first**. `noise` = distance < 3% (ignore); `true` = ~7%+ (low-leverage stack). Not a trade signal. |
| Nearest vs largest | `nearest_*` is a legacy alias of `largest_*` (size leader), not closest-to-mark. |
| Real vs estimated | `real_liquidations` = observed; `liq_density` clusters = modeled. Both labeled. |
| `magnet.score` | Directional density bias from OI / L-S / funding. **Not** a hit probability. |

The radar glossary and scenarios also ship on `get_agent_manifest` → `agent_interpretation_rules_v1`. Use `journeys_v1` for the execution-context and swap workflows.

## Execution context throughout an order

### Before the order — `get_execution_quote`

**“For a buy of 0.1 ETH, what execution conditions are visible now?”** Supply the symbol, side and quantity in token units. Read the available book depth, estimated volume-weighted average price (VWAP), spread, depth cost and separate exchange/builder fees. Unknown fees remain unknown; insufficient visible depth does not imply a full fill. Save the returned `baseline` object unchanged in your agent's state.

### At the next check — `compare_execution_context`

**“For that same order, what changed since my last check?”** Supply the saved baseline to compare visible liquidity, estimated costs and data quality against a new snapshot. Use the returned baseline for the next check. Your agent chooses when to check again; this compares snapshots rather than tracking every intervening event. Keep a separate `pre_order_baseline` immediately before your own execution.

### After execution — `reconcile_execution`

**“How did my actual fills compare with my pre-order estimate?”** Supply that pre-order baseline and your fills for one order. The tool separates price and fee differences at the quantity actually executed. It does not fetch your account's fills or verify caller-supplied records, and it does not infer that latency caused a price difference.

These three tools provide read-only context for **Hyperliquid perpetual orders**. They do not submit orders. Check the returned data-quality and freshness indicators before using an estimate. [Workflow, input examples and field definitions](docs/execution-context.md).

## Cross-chain swaps — `swap_via_nattswap`

**“What route is available to swap my token on one chain for a token on another?”** Supply the source/destination chains and tokens, amount and wallet addresses. Review the Li.Fi route, costs and execution readiness; your agent signs with its own wallet. This is a separate workflow from a Hyperliquid perpetual execution quote. [Swap inputs and execution steps](tools/swap_via_nattswap.md).

## Trial and pricing

Daily MCP trial: one free call per paid tool and per token per client each UTC day. Four tools x seven tokens = up to 28 independent trials; then 0.001 USDC per call. Read trial_policy_v2 and free_tier_status_v1 on the same MCP connection for current availability. A zero daily_cap is the separate credit pool, not the intro allowance.

## What you get

| Tool | Price |
|------|-------|
| `get_agent_manifest` | Free — call first |
| `get_liq_radar` | **$0.001** x402 (Base EIP-3009 **or** Solana SVM exact) |
| `swap_via_nattswap` | Free at MCP (you sign; gas + Li.Fi fee on-chain) |
| `get_execution_quote` | **$0.001** x402, or eligible credits |
| `compare_execution_context` | **$0.001** x402, or eligible credits |
| `reconcile_execution` | **$0.001** x402, or eligible credits |

**Solana pay:** rail is **live** (SVM exact). Do **not** reuse an EVM/Base x402 client. Use `@x402/svm`. A Base HTTP 200 is not a Solana payment. See [docs/x402-pay.md](docs/x402-pay.md).

Whitelist `get_liq_radar`: **BTC ETH SOL BNB XRP HYPE ZEC** (omit `symbol` = BTC).

### What we do NOT claim

| We do **not** claim | What we **do** show |
|---------------------|---------------------|
| Generic Coinglass wrapper | Operator-shaped forced-order map for agents |
| Predictive Fuel Score / sweep classifier | Distance, size, OI, real liqs — labeled |
| Custody of keys or funds | Agent signs own txs |
| Trade advice / guaranteed edge | Read-only JSON context |
| More than 6 MCP tools | **Exactly 6** · v2.8.0 |
| Vault / `/stats` = Terminal P&L | Separate HyperNatt vault product |
| Independent security audit | Public code + [SECURITY.md](./SECURITY.md) |

## Try it

```bash
curl -s https://hypernatt.com/api/m2m/agent/manifest
curl -i https://hypernatt.com/api/m2m/liq-radar
```

| Step | Link |
|------|------|
| Quickstart | [docs/quickstart.md](docs/quickstart.md) |
| **x402 Base vs Solana** | [docs/x402-pay.md](docs/x402-pay.md) |
| Integrations (5 clients + AgentKit) | [docs/integrations.md](docs/integrations.md) |
| HL terrain example (read-only) | [examples/hyperliquid/read_terrain.py](examples/hyperliquid/read_terrain.py) |
| Honest interpret example | [examples/liq_radar_interpret.py](examples/liq_radar_interpret.py) |
| CDP Bazaar checklist | [docs/cdp-bazaar-checklist.md](docs/cdp-bazaar-checklist.md) |
| Examples | [examples/](examples/) |
| Security | [SECURITY.md](SECURITY.md) |
| Buyer skill (use the MCP) | [skills/hypernatt-terminal/SKILL.md](skills/hypernatt-terminal/SKILL.md) |
| Seller skill (x402 hardening) | [solana-x402-seller-security-skill](https://github.com/DIALLOUBE-RESEARCH/solana-x402-seller-security-skill) |
| Tests | [test/](test/) — `npm test` |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |

MCP: https://hypernatt.com/mcp/protocol

### For non-crypto users (x402 wallet)

If you do not already have a funded USDC wallet, install **Coinbase Agentic Wallet MCP** first (email/OTP + card onramp — no seed phrase):

```bash
npx @coinbase/payments-mcp
```

Docs: [Agentic Wallet MCP](https://docs.cdp.coinbase.com/agentic-wallet/mcp/welcome). Then connect HyperNatt Terminal (`https://hypernatt.com/mcp/protocol`). Your agent can pay `get_liq_radar` ($0.001) automatically when it sees HTTP 402.

Optional heavy use (not required): swap-earned quota or $5/mo Agent Pass — see live `pass_program` / `quota_program` on the manifest.

## License

MIT — see [LICENSE](LICENSE).

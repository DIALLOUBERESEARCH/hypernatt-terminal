# CDP Bazaar / AgentKit discovery — owner checklist (F#104N)

Submit HyperNatt Terminal where Coinbase / CDP agents discover HTTP + x402
services. **Owner action** — no secrets in git.

## What to list

| Field | Value |
|-------|-------|
| Name | HyperNatt Terminal |
| One-liner | Forced-order / liquidation map for AI agents + Li.Fi swap (read-only; not trade advice) |
| MCP URL | `https://hypernatt.com/mcp/protocol` |
| REST probe | `GET https://hypernatt.com/api/m2m/liq-radar` |
| Manifest | `GET https://hypernatt.com/api/m2m/agent/manifest` |
| Pricing | `get_agent_manifest` free · `get_liq_radar` **$0.001** x402 (Base + Solana) · swap free at MCP |
| Tools | **3** · v2.7.0 — `get_agent_manifest`, `get_liq_radar`, `swap_via_nattswap` |
| Repo | https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal |
| Docs | this repo README + [integrations.md](integrations.md) |

## Do NOT claim on the listing

- BUY/SELL/HOLD signal or confidence score
- Vault / `/stats` as Terminal P&L
- Custody or “we place Hyperliquid orders”
- More than 3 MCP tools

## Buyer path (AgentKit)

See [integrations.md](integrations.md) section **Coinbase AgentKit / x402 buyer**
and [swap-agentkit.md](swap-agentkit.md) for swaps.

Wallet friction (humans): `npx @coinbase/payments-mcp`

## After submit

1. Note listing URL in handoff `210_HANDOFF_TERMINAL_X402_GTM_*` §0bis
2. Smoke: agent can hit 402 → pay → liq-radar JSON
3. Keep copy aligned with README Forced-order framing

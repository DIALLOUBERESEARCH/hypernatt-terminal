# Security & Trust — HyperNatt Terminal

Connecting an unknown MCP server to your agent is a real risk. You should be
skeptical. This page answers the questions a careful developer asks, factually.
Machine-readable version: the `security_v1` block in `get_agent_manifest`.

> Treat every MCP server as untrusted by default — including this one — and
> verify the claims below yourself. We are not independently audited.

## Can this server move or drain my funds?

**No.** It has no custody and never sees your keys.

- **Decision Core reads are read-only** and need **no wallet at all** (free tier).
- **Swap tools are advisory**: `swap_via_nattswap` / `swap_quote` *return* a Li.Fi
  quote and step-by-step instructions. **Your agent decides and signs its own
  transaction.** The server never holds keys and never broadcasts anything.

## Does it hold API keys I could leak?

**No keys.** Payment is **x402, per call** ($0.01 USDC/credit on Base), controlled
by your agent — no accounts, no static API keys, no subscription lock-in. The free
daily pool needs no wallet on the MCP session.

## What data does it see / store?

Only **tool-usage metadata** (wallet address if you pass one, tool name, timestamp)
to improve the terminal. **No prompt content. Never your keys or local files.**

## Prompt injection / tool poisoning?

Decision Core responses are **structured JSON data** (state, scores, prices), not
free-form instructions. Interpretation guardrails (`interpretation_contract_v1`,
`do_not_infer`) bound how the data should be read. The swap tools' "instructions"
are **advisory for your agent to evaluate**, not commands the server executes.

## How do I verify all this?

- **Read the source** — the server is public:
  https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal
- **On-chain**: the live vault on Hyperliquid and the public track record at
  https://hypernatt.com/stats
- **Inspect before connecting**: `curl -s https://hypernatt.com/api/m2m/agent/manifest`
  (free, no wallet) — see the `security_v1` block.

## Reporting a vulnerability

Open a private security advisory / issue on the GitHub repository above. We
respond to good-faith reports.

## What we do NOT claim

We do **not** claim to be unhackable, bank-grade, or independently audited. We
claim only what is verifiable above. If a statement here is ever contradicted by
the code, the **code wins** — tell us.

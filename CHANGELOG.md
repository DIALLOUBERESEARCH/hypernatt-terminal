# Changelog — hypernatt-terminal

All notable changes to the **public** HyperNatt Terminal MCP mirror.
Private monorepo history is separate (see README mirror note).

## [2.7.2] — 2026-08-30

### Changed
- [x402-pay.md](docs/x402-pay.md): Solana SVM rail is **live** (first `get_liq_radar`
  settle 2026-08-29). Payload must keep `accepted.asset` = 402 mint. Retry with
  `X-Payment` or `PAYMENT-SIGNATURE`. A Base 200 is not a Solana payment.
- Public MCP mirror now ships SVM seller helpers (`x402-svm-hydrate.mjs`,
  `x402-svm-ata.mjs`, `x402-svm-prepare.mjs`) so a clone matches hosted verify.

## [2.7.1] — 2026-08-16

### Changed
- Organ first: README / quickstart / skills tell agents to read `cluster_grammar`
  before `liq_radar`. Dropped "nearest cluster" as the first prompt (noise trap).
- GitHub About must match live 3-tool forced-order map (not "BTC Decision Terminal").

---

## [2.7.0] — 2026-08-07

### Added
- **F#104N GTM DX:** README Quick start (30s) Claude Connectors table; 5-client
  integrations table; `examples/hyperliquid/read_terrain.py` (read-only terrain);
  AgentKit/CDP buyer path for `liq-radar`; [cdp-bazaar-checklist.md](docs/cdp-bazaar-checklist.md).
- README / quickstart / buyer skill: **For non-crypto users** — recommend
  `npx @coinbase/payments-mcp` + CDP Agentic Wallet docs (x402 wallet friction).
- Live manifest `onboarding.payment_help` (same pointer; additive, no pricing change).

### Fixed
- Stopped presenting `https://hypernatt.com/stats` as Terminal MCP track record
  (vault / platform P&L is a **separate** HyperNatt product).
- Removed residual `/stats` + FOMO (`unlock_premium` / `you_missed_this`) from
  live `proof_of_edge` (F#101N).
- Aligned public docs/examples with live surface: **3 tools** only
  (`get_agent_manifest`, `get_liq_radar`, `swap_via_nattswap`).
- Purged leftover trap/signal examples and demounted tool docs from the public mirror.
- Payment-error copy: Agent Pass **$5**, free tools = manifest + swap (no vault_proof / legacy prices).
- npm audit: bumped axios + overrides — **0 vulnerabilities** on the MCP package.

### Removed
- Orphan x402 modules for demounted tools (F#102N): `x402-signal.mjs`,
  `x402-mm-hunt.mjs`, `x402-similarity.mjs` (+ their unit tests). Not imported by
  the live 3-tool MCP server.

### Added
- README packaging: badges, **What we do NOT claim**, Start here, Security + seller skill link.
- Examples: `liq_radar_min.py`, `swap_after_liq_radar.py`.
- CI guard: `scripts/verify-mcp-tool-count.mjs` (Docker / card must list exactly 3 tools).
- GitHub Actions **CI** (`.github/workflows/ci.yml`): `npm test` + `npm audit --audit-level=high` + verify 3 tools.
- Buyer skill: `skills/hypernatt-terminal/SKILL.md`.
- Visible `test/` suite synced from monorepo (node:test).
- `CHANGELOG.md`.

### Changed
- Title / positioning: **Liq Radar + Swap** (not BTC Decision Terminal).
- Manifest section rename: **Liquidation radar** (was Decision Core).
- Public paywall framing: **free + pay-per-call** first; Pass/quota demoted to power-user.
- README: solo-builder tone (F#101N); listing badges restored (Glama + x402-list) — credibility signals, not vanity.
- Version **2.7.0** · Streamable HTTP · whitelist BTC ETH SOL BNB XRP HYPE ZEC.

## [2.6.0] — 2026-07

Historical multi-tool surface (up to ~15 MCP tools). Superseded by 2.7.0 cut.
Do not treat older README/cache copies as current truth.

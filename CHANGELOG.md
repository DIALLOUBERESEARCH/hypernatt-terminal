# Changelog — hypernatt-terminal

All notable changes to the **public** HyperNatt Terminal MCP mirror.
Private monorepo history is separate (see README mirror note).

## [2.7.0] — 2026-08-07

### Fixed
- Stopped presenting `https://hypernatt.com/stats` as Terminal MCP track record
  (vault / platform P&L is a **separate** HyperNatt product).
- Aligned public docs/examples with live surface: **3 tools** only
  (`get_agent_manifest`, `get_liq_radar`, `swap_via_nattswap`).
- Purged leftover trap/signal examples and demounted tool docs from the public mirror.
- Payment-error copy: Agent Pass **$5**, free tools = manifest + swap (no vault_proof / $19).
- npm audit: bumped axios + overrides — **0 vulnerabilities** on the MCP package.

### Added
- README packaging: badges, **What we do NOT claim**, Start here, Security + seller skill link.
- Examples: `liq_radar_min.py`, `swap_after_liq_radar.py`.
- CI guard: `scripts/verify-mcp-tool-count.mjs` (Docker / card must list exactly 3 tools).
- Buyer skill: `skills/hypernatt-terminal/SKILL.md`.
- Visible `test/` suite synced from monorepo (node:test).

### Changed
- Title / positioning: **Liq Radar + Swap** (not BTC Decision Terminal).
- Version **2.7.0** · Streamable HTTP · whitelist BTC ETH SOL BNB XRP HYPE ZEC.

## [2.6.0] — 2026-07

Historical multi-tool surface (up to ~15 MCP tools). Superseded by 2.7.0 cut.
Do not treat older README/cache copies as current truth.

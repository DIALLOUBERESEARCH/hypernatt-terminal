# HyperNatt Terminal — Integrations

How to plug HyperNatt Terminal into your agent. Read-only BTC/USDC context, not
trade advice. No custody. Verify on-chain.

Two ways in:
- **MCP** (any MCP client): `https://hypernatt.com/mcp/protocol`
- **REST + x402** (any HTTP agent): `https://hypernatt.com/api/m2m/...`

**Trading your own Hyperliquid account?** Pair this Decision Core with **your** HL
agent-wallet exec tools — no vault deposit. Guide:
[agent-hl-sovereignty.md](agent-hl-sovereignty.md).

Sections marked **[verified]** run as-is. Sections marked **[reference]** point to
each framework's own docs and were not smoke-tested here.

---

## 1. Any MCP client — Claude / Cursor / Windsurf  [verified]

Add the connector, then prompt the agent.

| Field | Value |
|-------|-------|
| MCP URL | `https://hypernatt.com/mcp/protocol` |
| SSE | `https://hypernatt.com/mcp/sse` |
| Server card | `https://hypernatt.com/.well-known/mcp/server-card.json` |
| Smithery | `npx -y @smithery/cli@latest mcp add hypernatt/hypernatt-terminal` |

Example prompt:

> Call get_agent_manifest, then get_mm_trap_state — is the MM trapping BTC right now?

`get_agent_manifest` and `get_vault_proof` are free. The first call per Decision Core tool
is free (intro, no wallet); then x402 — no daily credit pool.

---

## 2. Zero-setup REST — no wallet  [verified]

```bash
# Full catalog (9 tools, prices, ecosystem) — free, no wallet:
curl -s https://hypernatt.com/api/m2m/agent/manifest

# Verifiable live vault data (edge measurement preliminary — verify on-chain):
curl -s https://hypernatt.com/api/m2m/proof-of-edge

# A Decision Core read — first call per tool is free (intro), no wallet:
curl -s https://hypernatt.com/api/m2m/mm-trap-state
```

Once the intro-free call per tool is used, the paid endpoints return **HTTP 402** with x402
payment instructions. Pay **$0.001 USDC on Base or Solana** and retry with the `X-Payment`
header (or pass `agent_wallet` to use swap-earned quota).

Paid endpoints: `/api/m2m/{signal,mm-hunt,similarity-match,liq-radar,mm-trap-state}` and
`GET /api/m2m/swap/quote` ($0.001 — quote only; execution is separate).

**Swaps (execution):** prefer MCP `swap_via_nattswap` (free at API layer). Full guide:
[swap-agentkit.md](swap-agentkit.md). Never use `get_vault_proof.vault_address` as
`fromAddress` — use your agent signing wallet.

---

## 3. Coinbase AgentKit / x402  [endpoint verified · SDK reference]

HyperNatt endpoints speak x402 natively (402 -> pay -> retry). An x402-capable
client pays the $0.001 USDC on Base or Solana automatically and retries — no API keys.

- **Verified (our side):** the endpoints in section 2 return 402 with x402
  instructions once the intro-free call is used, and accept the `X-Payment` retry.
- **Reference (SDK side, not smoke-tested here):** wire your AgentKit / CDP x402
  client to the HyperNatt endpoint and let it settle on Base or Solana. See the Coinbase
  Developer Platform x402 docs for the client setup.
- **Swaps:** x402 pays the **quote API** only. Signing the Li.Fi `transactionRequest`
  requires your agent wallet + gas on the source chain — see [swap-agentkit.md](swap-agentkit.md).

---

## 4. ElizaOS / GOAT and other agent frameworks  [reference]

These were not smoke-tested here — connect via either surface above:

- **Via MCP:** point the framework's MCP client at `https://hypernatt.com/mcp/protocol`.
- **Via REST:** call the endpoints in section 2; handle 402 with an x402 client.

See each framework's own documentation for plugin / tool wiring. The HyperNatt
side is the standard MCP + REST + x402 surface described above.

---

## 5. Hermes Agent (Nous Research)  [verified config · runtime reference]

Hermes discovers MCP tools at startup from `~/.hermes/config.yaml`. Streamable HTTP is supported.

```yaml
mcp_servers:
  hypernatt-terminal:
    url: https://hypernatt.com/mcp/protocol
    transport: streamable-http
```

**Sovereignty pattern (2 MCP):** keep HyperNatt for Decision Core, add a **separate**
Hyperliquid execution MCP/SDK with **your** agent wallet — see
[agent-hl-sovereignty.md](agent-hl-sovereignty.md). HyperNatt never places HL orders.

Restart gateway or CLI after editing config. Ensure the MCP toolset is enabled (Hermes skill `native-mcp`).

**Optional:** install the agentskills.io onboarding skill from this repo:

```bash
hermes skills install github/DIALLOUBE-RESEARCH/hypernatt-terminal/skills/hypernatt-terminal
```

Skill path: [../skills/hypernatt-terminal/SKILL.md](../skills/hypernatt-terminal/SKILL.md)

Listings: awesome-hermes-agent, Hermes Atlas (issue suggest-repo), Smithery, Glama.

---

## Notes

- Decision Core reads are **read-only context, not trade recommendations**.
- Cross-check everything: live vault on Hyperliquid and the public track record at
  https://hypernatt.com/stats.
- Pricing and tiers: see [quickstart](quickstart.md).

# CDP Bazaar / AgentKit — historique et verification du catalogue

La section suivante est un constat date du **2026-08-07**, pas une verification actuelle des annuaires. Le catalogue MCP actuel contient six outils : voir [reference.md](reference.md). Les trois outils de contexte d'execution Hyperliquid sont accessibles par MCP ; ils ne sont pas trois nouvelles URLs REST Bazaar.

**Verdict 2026-08-07 :** le **vrai** CDP Bazaar (discovery x402 HTTP) est
**deja fait** — pas une soumission formulaire MCP a refaire.

## Ce qui a deja ete livre (prouve)

| Fait | Preuve |
|------|--------|
| Emission `extensions.bazaar` sur 402 | `middleware/x402.middleware.ts` (F#32N) |
| Live `GET /api/m2m/liq-radar` → 402 + `extensions.bazaar` | mesure 2026-08-07 |
| Indexation CDP Bazaar des ressources HyperNatt | handoff `210` §8.55 (2026-06-22) — **6 ressources indexees**, amt=$0.001 |
| Docs AgentKit / buyer | `integrations.md`, `swap-agentkit.md`, Option A `payments-mcp` |

CDP Bazaar = **cache crawl** des 402 avec `extensions.bazaar` via le facilitator
CDP. Ce n'est **pas** un listing Smithery-like a "Submit Server".

## Ce qu'il ne faut PAS faire

- Rouvrir une "soumission Bazaar" comme si on n'y etait pas
- Confondre avec **x402-list.com** (autre annuaire ; ancien constat du 2026-08-07 : listing a 15 outils / 429)
- Confondre avec **x402scan** (autre crawler ; OG home ≠ pitch Terminal)

## Optionnel (owner / agent)

1. Re-scan Bazaar in-container (auth CDP) si doute sur les anciennes URLs indexees ; ne pas assimiler leur nombre au nombre d'outils MCP
2. Verifier que les ressources **demountees** (signal, mm-hunt, …) ne polluent
   plus le catalogue — et que **liq-radar** + **swap** restent clean Forced-order
3. Garder AgentKit buyer path a jour (deja F#104N)

## Buyer path (AgentKit) — toujours utile

Voir [integrations.md](integrations.md) section **Coinbase AgentKit / x402 buyer**
et [swap-agentkit.md](swap-agentkit.md).

Wallet friction : `npx @coinbase/payments-mcp`

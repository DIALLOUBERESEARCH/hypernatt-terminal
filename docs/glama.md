# Glama server submission

Submit at **https://glama.ai/mcp/servers** → **Add Server** (not Connectors).

| Field | Value |
|-------|--------|
| GitHub repo | `https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal` |
| Dockerfile | `./Dockerfile` (repo root) |
| License | MIT |
| Hosted MCP (optional) | `https://hypernatt.com/mcp/protocol` |
| Quickstart | [docs/quickstart.md](quickstart.md) |

After evaluation:

- Server page: https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal
- Badge: https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal/badges/score.svg

Connector (already live, separate): https://glama.ai/mcp/connectors/com.hypernatt/hypernatt-terminal

## Local Docker smoke

```bash
docker build -t hypernatt-terminal .
docker run --rm -p 8011:8011 hypernatt-terminal
curl -sS http://127.0.0.1:8011/health
```

Expected after rebuild: `"version":"2.8.0"`, `"tools":6`, `mcp_sessions_v1` on `GET /health`.

## Re-sync after version bump (BLOQUANT)

Glama rebuild le Docker + introspection `stdio.mjs` (`tools/list`). README seul ne suffit pas.

1. Sync monorepo -> `hypernatt-terminal` (runtime MCP + `public-repo/` + **package-lock.json**)
2. `git push origin main`
3. Glama admin -> **Repository** -> **Sync Server** (claim server if needed)
4. Attendre rebuild sandbox (~10-30 min). Onglet **Tools** = **6** entries:
   `get_agent_manifest`, `get_liq_radar`, `swap_via_nattswap`,
   `get_execution_quote`, `compare_execution_context`, `reconcile_execution`
5. Hard refresh (Ctrl+F5) page publique

## Glama Dockerfile admin (quality check) — BLOQUANT

Glama indexes tools via `mcp-proxy` + **stdio** (`tools/list`).

**Admin → Server → Dockerfile settings**:

| Field | Value |
|-------|--------|
| Dockerfile path | `./Dockerfile` |
| Build steps | *(leave empty — Dockerfile runs `npm ci`)* |
| **CMD arguments** | **`["node", "stdio.mjs"]`** |
| Placeholder parameters | `{}` |

Dockerfile `CMD ["node", "server.js"]` is for **HTTP healthcheck only**; Glama admin CMD overrides introspection to stdio.

Prod agents use HTTP: `https://hypernatt.com/mcp/protocol`.

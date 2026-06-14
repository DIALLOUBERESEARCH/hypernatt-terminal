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

Expected after rebuild: `"version":"2.5.11"`, `"tools":9`, `mcp_sessions_v1` on `GET /health`.

## Re-sync after version bump (BLOQUANT)

Glama rebuild le Docker + introspection `stdio.mjs` (`tools/list`). README seul ne suffit pas si `/health` est stale.

1. Sync monorepo -> `hypernatt-terminal` (`sync-hypernatt-terminal-repo.ps1`) — **must include `package-lock.json`** or Glama `npm ci` fails silently.
2. `git push origin main`.
3. Glama admin -> **Repository** -> **Sync Server**.
4. Attendre rebuild sandbox (~10-30 min). Onglet **Tools** = 9 entries.
5. Hard refresh (Ctrl+F5) page publique.

## Glama Dockerfile admin (quality check) — BLOQUANT

Glama indexes tools via `mcp-proxy` + **stdio** (`tools/list`). If CMD = `server.js`, you get a **stale subset (~11 tools)**.

**Admin → Server → Dockerfile settings** (must match exactly):

| Field | Value |
|-------|--------|
| Dockerfile path | `./Dockerfile` |
| Build steps | *(leave empty — Dockerfile runs `npm ci`)* |
| **CMD arguments** | **`["node", "stdio.mjs"]`** |
| Placeholder parameters | `{}` |

Dockerfile `CMD ["node", "server.js"]` is for **HTTP healthcheck only**; Glama admin CMD overrides introspection to stdio.

After **Sync Server**, onglet **Tools** must show **9** entries including:
`get_liq_radar`, `get_mm_trap_state`.

If still wrong count: hard refresh (Ctrl+F5) → re-Sync → wait build **Succeeded** (~30 min).

Prod agents use HTTP: `node server.js` → `https://hypernatt.com/mcp/protocol`.

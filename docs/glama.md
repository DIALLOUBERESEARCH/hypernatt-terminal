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

Expected: `"status":"healthy"`, `"version":"2.4.0"`, **14 tools** (incl. `get_liq_radar`, `get_mm_trap_state`).

## Re-sync after version bump

1. Push `main` on this repo (runtime + docs).
2. Glama admin → **Repository** → **Sync Server** (https://glama.ai/mcp/servers/DIALLOUBE-RESEARCH/hypernatt-terminal/admin/repository).
3. Hard refresh the public server page after ~5 min.

## Glama Dockerfile admin (quality check)

Glama runs `mcp-proxy` with **stdio** introspection. Use `stdio.mjs`, not `server.js`:

| Field | Value |
|-------|--------|
| Build steps | `["npm ci --omit=dev"]` |
| CMD arguments | `["node", "stdio.mjs"]` |
| Placeholder parameters | `{}` |

Prod agents use HTTP: `node server.js` → `https://hypernatt.com/mcp/protocol`.

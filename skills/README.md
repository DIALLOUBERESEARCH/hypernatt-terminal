# Agent skills (agentskills.io)

Optional onboarding skills for agent runtimes (Hermes Agent, OpenClaw via ClawHub, etc.).

| Skill | Path | Purpose |
|-------|------|---------|
| **hypernatt-terminal** | [hypernatt-terminal/SKILL.md](hypernatt-terminal/SKILL.md) | Wire HyperNatt MCP + pricing + recommended call order |

## Install (Hermes)

```bash
hermes skills install github/DIALLOUBE-RESEARCH/hypernatt-terminal/skills/hypernatt-terminal
```

Or copy the YAML block from `SKILL.md` into `~/.hermes/config.yaml` under `mcp_servers`.

## MCP without a skill

The MCP server works without installing any skill — add the connector URL only:

`https://hypernatt.com/mcp/protocol`

See [docs/integrations.md](../docs/integrations.md) and [docs/quickstart.md](../docs/quickstart.md).

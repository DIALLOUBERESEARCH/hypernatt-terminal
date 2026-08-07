# Agent skills (agentskills.io)

Optional onboarding skills for agent runtimes (Hermes Agent, OpenClaw via ClawHub, Bankr, etc.).

| Skill | Path | Purpose |
|-------|------|---------|
| **hypernatt-liq-radar** | [hypernatt-liq-radar/SKILL.md](hypernatt-liq-radar/SKILL.md) | **Trading-first** — call get_liq_radar before sizing/entering a perp |
| **hypernatt-terminal** | [hypernatt-terminal/SKILL.md](hypernatt-terminal/SKILL.md) | Full MCP onboarding (3 tools + x402 wallet) |

GTM context: [../../registry/GTM_TRADING_INTENT_DISCOVERY.md](../../registry/GTM_TRADING_INTENT_DISCOVERY.md)

## Install (Hermes)

```bash
hermes skills install github/DIALLOUBE-RESEARCH/hypernatt-terminal/skills/hypernatt-liq-radar
hermes skills install github/DIALLOUBE-RESEARCH/hypernatt-terminal/skills/hypernatt-terminal
```

## Install (OpenClaw / ClawHub)

After mirror sync + `clawhub login`:

```bash
clawhub skill publish ./skills/hypernatt-liq-radar --slug hypernatt-liq-radar --name "HyperNatt Liq Radar" --version 1.0.0
openclaw skills install hypernatt-liq-radar
```

Or copy the YAML block from `SKILL.md` into `~/.hermes/config.yaml` under `mcp_servers`.

## MCP without a skill

The MCP server works without installing any skill — add the connector URL only:

`https://hypernatt.com/mcp/protocol`

See [docs/integrations.md](../docs/integrations.md) and [docs/quickstart.md](../docs/quickstart.md).

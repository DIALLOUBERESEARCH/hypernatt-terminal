#!/usr/bin/env python3
"""HyperNatt Terminal - minimal free taste (stdlib only).

1) Free compact public manifest (six-tool catalog)
2) Choose liquidation, execution-context or swap journey by intent

Read-only liquidation context, NOT trade advice. No custody.

Run:  python examples/liq_radar_min.py
"""

from __future__ import annotations

import json
import urllib.request

BASE = "https://hypernatt.com"
WHITELIST = ("BTC", "ETH", "SOL", "BNB", "XRP", "HYPE", "ZEC")


def get(path: str) -> dict:
    with urllib.request.urlopen(BASE + path, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    try:
        manifest = get("/api/m2m/agent/manifest")
    except Exception as exc:
        print(f"[error] free manifest unavailable: {exc}")
        return 1

    tools = manifest.get("tools", [])
    if not tools or not manifest.get("mcp_url") or not manifest.get("journeys_v1"):
        print("[error] compact manifest is missing its catalog, MCP URL or journeys")
        return 1
    print(f"HyperNatt Terminal v{manifest.get('version')} - {len(tools)} tools")
    print(f"  mcp url : {manifest['mcp_url']}")
    print(f"  tools   : {' | '.join(tool['name'] for tool in tools)}")
    print(f"  whitelist get_liq_radar: {' '.join(WHITELIST)} (omit symbol = BTC)")

    for intent, tool in manifest["journeys_v1"].get("choose_by_intent", {}).items():
        print(f"  {intent}: {tool}")

    print()
    print("Next (MCP): connect https://hypernatt.com/mcp/protocol")
    print("  1. get_agent_manifest")
    print("  2. Choose a journey above; none requires buying an unrelated tool.")
    print("  3. For pass/quota programs: get_agent_manifest with detail=full.")
    print()
    print("HTTP probe (expects 402 Payment Required):")
    print("  curl -i https://hypernatt.com/api/m2m/liq-radar")
    print()
    print("NOT trade advice. Security: SECURITY.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

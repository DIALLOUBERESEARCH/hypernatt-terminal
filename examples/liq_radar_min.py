#!/usr/bin/env python3
"""HyperNatt Terminal - minimal free taste (stdlib only).

1) Free public manifest (3-tool catalog)
2) How to call get_liq_radar via MCP (paid $0.001 x402 after intro)

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

    eco = manifest.get("ecosystem", {})
    sections = manifest.get("sections", [])
    print(f"HyperNatt Terminal v{manifest.get('version')} - {len(sections)} sections")
    print(f"  mcp url : {eco.get('mcp_url')}")
    print(f"  tools   : get_agent_manifest | get_liq_radar | swap_via_nattswap")
    print(f"  whitelist get_liq_radar: {' '.join(WHITELIST)} (omit symbol = BTC)")

    journeys = manifest.get("journeys") or manifest.get("suggested_journeys")
    if journeys:
        print(f"  journeys: {json.dumps(journeys)[:180]}")

    print()
    print("Next (MCP): connect https://hypernatt.com/mcp/protocol")
    print("  1. get_agent_manifest")
    print("  2. get_liq_radar  (optional symbol=ETH|SOL|...)")
    print("  3. optional swap_via_nattswap with YOUR agent wallet")
    print()
    print("HTTP probe (expects 402 Payment Required):")
    print("  curl -i https://hypernatt.com/api/m2m/liq-radar")
    print()
    print("NOT trade advice. Security: SECURITY.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

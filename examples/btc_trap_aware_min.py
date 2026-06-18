#!/usr/bin/env python3
"""HyperNatt Terminal - minimal zero-wallet taste (intro-free).

Reads the FREE public manifest (full 9-tool catalog + live proof-of-edge) with
no API key and no wallet, then prints how to go further with the Decision Core.

Read-only BTC/USDC context, NOT trade advice. No custody. Verify on-chain.

Run:  python examples/btc_trap_aware_min.py
Deps: none (Python standard library only).
"""

import json
import urllib.request

BASE = "https://hypernatt.com"


def get(path: str) -> dict:
    with urllib.request.urlopen(BASE + path, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    try:
        manifest = get("/api/m2m/agent/manifest")
    except Exception as exc:  # network / endpoint down -> clear message, no crash
        print(f"[error] free manifest unavailable: {exc}")
        return 1

    eco = manifest.get("ecosystem", {})
    sections = manifest.get("sections", [])
    print(f"HyperNatt Terminal v{manifest.get('version')} - {len(sections)} sections")
    print(f"  mcp url    : {eco.get('mcp_url')}")
    print(f"  vault stats: {eco.get('stats_url')}")

    poe = manifest.get("proof_of_edge")
    if poe:
        print(f"  proof_of_edge: {json.dumps(poe)[:200]}")

    print()
    print("Next (free, no wallet): connect the MCP at the url above in Claude/Cursor,")
    print("then call get_vault_proof and get_mm_trap_state.")
    print("Decision Core reads = read-only context, first call per tool free (intro),")
    print("no daily credit pool, HOLD always free; beyond that $0.001/call via x402 on Base.")
    print()
    print("This is NOT trade advice. Verify on-chain:", eco.get("stats_url"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

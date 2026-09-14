#!/usr/bin/env python3
"""HyperNatt — swap readiness checklist (stdlib only, no wallet required).

Fetches the live manifest and prints wallet_onboarding_v1 + a builder checklist.
Optional: set AGENT_WALLET=0x... to validate address format (no on-chain calls).

Run:  python examples/swap_readiness_check.py
"""

import json
import os
import re
import urllib.request

BASE = "https://hypernatt.com"
EVM_RE = re.compile(r"^0x[a-fA-F0-9]{40}$")


def get(path: str) -> dict:
    with urllib.request.urlopen(BASE + path, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    try:
        manifest = get("/api/m2m/agent/manifest?detail=full")
    except Exception as exc:
        print(f"[error] manifest unavailable: {exc}")
        return 1

    execution = next(
        (s for s in manifest.get("sections", []) if s.get("name") == "Execution"),
        {},
    )
    onboarding = execution.get("wallet_onboarding_v1") or {}
    contract = execution.get("swap_execution_contract_v1") or {}

    if not onboarding or not contract or not manifest.get("ecosystem", {}).get("mcp_url"):
        print("[error] full manifest is missing swap onboarding, execution rules or MCP URL")
        return 1

    print("HyperNatt swap readiness check")
    print(f"  terminal version: {manifest.get('version')}")
    print(f"  mcp url         : {manifest.get('ecosystem', {}).get('mcp_url')}")
    print()

    if onboarding:
        print("wallet_onboarding_v1:")
        print(f"  {onboarding.get('summary_en', '')}")
        print(f"  doc: {onboarding.get('doc_url', '')}")
        print()
        print("Prerequisites:")
        for line in onboarding.get("prerequisites_en", []):
            print(f"  - {line}")

    print()
    print("Execution rules (never skip):")
    for rule in contract.get("rules_en", []):
        print(f"  - {rule}")

    wallet = (os.environ.get("AGENT_WALLET") or "").strip()
    if wallet:
        print()
        if EVM_RE.match(wallet):
            print(f"AGENT_WALLET format: OK ({wallet[:10]}...)")
            print("Next: connect MCP and call swap_via_nattswap with this as fromAddress + toAddress.")
        else:
            print(f"AGENT_WALLET invalid: {wallet!r} (need 0x + 40 hex)")
            return 1
    else:
        print()
        print("Optional: export AGENT_WALLET=0xYourHotWallet to validate format.")
        print("Full demo: docs/agent-swap-demo.md")

    print()
    print("Demo path: docs/agent-swap-demo.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

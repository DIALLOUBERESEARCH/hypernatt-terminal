#!/usr/bin/env python3
"""HyperNatt — read liq radar then quote swap with YOUR agent wallet (stdlib).

  python examples/swap_after_liq_radar.py
  python examples/swap_after_liq_radar.py --compare-vault
  AGENT_WALLET=0xYourWallet python examples/swap_after_liq_radar.py --quote

Optional: HYPERNATT_MCP_URL (default prod). For on-chain CDP exec: cdp_swap_execute.mjs
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

MCP_URL = os.environ.get("HYPERNATT_MCP_URL", "https://hypernatt.com/mcp/protocol").rstrip("/")
VAULT = "0x04e2eb302fe9ff23a9d1f2455084af624737a6d8"
USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
WETH_BASE = "0x4200000000000000000000000000000000000006"
SWAP_AMOUNT = os.environ.get("SWAP_FROM_AMOUNT", "1000000")  # 1 USDC


def post(
    payload: dict,
    session_id: str | None = None,
    *,
    client_name: str = "hypernatt-swap-after-liq-radar",
) -> tuple[int, str, str | None]:
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "User-Agent": f"{client_name}/1.0",
    }
    if session_id:
        headers["mcp-session-id"] = session_id
    if payload.get("method") == "initialize":
        payload = dict(payload)
        params = dict(payload.get("params") or {})
        client = dict(params.get("clientInfo") or {})
        client.setdefault("name", client_name)
        client.setdefault("version", "1.0")
        params["clientInfo"] = client
        payload["params"] = params
    req = urllib.request.Request(
        MCP_URL,
        data=json.dumps(payload).encode(),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, resp.read().decode(), resp.headers.get("mcp-session-id")
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode(), err.headers.get("mcp-session-id")


def parse_sse_json(body: str) -> dict:
    for line in body.splitlines():
        if line.startswith("data: "):
            try:
                return json.loads(line[6:])
            except json.JSONDecodeError:
                pass
    body = body.strip()
    if body.startswith("{"):
        return json.loads(body)
    return {}


def tool_text(parsed: dict) -> str:
    try:
        return parsed["result"]["content"][0]["text"]
    except (KeyError, IndexError, TypeError):
        return json.dumps(parsed)[:2000]


def init_session() -> str:
    init = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "hypernatt-swap-after-liq-radar", "version": "1.0"},
        },
    }
    status, body, sid = post(init)
    if status != 200 or not sid:
        raise RuntimeError(f"MCP init failed status={status} body={body[:300]}")
    post({"jsonrpc": "2.0", "method": "notifications/initialized"}, session_id=sid)
    return sid


def call_tool(sid: str, name: str, arguments: dict | None = None) -> tuple[int, dict]:
    payload = {
        "jsonrpc": "2.0",
        "id": int(time.time() * 1000) % 1_000_000,
        "method": "tools/call",
        "params": {"name": name, "arguments": arguments or {}},
    }
    status, body, _ = post(payload, session_id=sid)
    return status, parse_sse_json(body)


def swap_args(from_address: str) -> dict:
    return {
        "fromChain": 8453,
        "toChain": 8453,
        "fromToken": USDC_BASE,
        "toToken": WETH_BASE,
        "fromAmount": SWAP_AMOUNT,
        "fromAddress": from_address,
        "toAddress": from_address,
    }


def parse_swap_payload(text: str) -> dict:
    try:
        outer = json.loads(text)
    except json.JSONDecodeError:
        return {}
    data = outer.get("data") if isinstance(outer, dict) else None
    if isinstance(data, dict):
        return data
    return outer if isinstance(outer, dict) else {}


def print_readiness(label: str, data: dict) -> None:
    readiness = data.get("execution_readiness") or {}
    can = readiness.get("can_execute")
    blockers = readiness.get("blockers") or []
    print(f"\n=== {label} ===")
    print(f"  can_execute: {can}")
    if blockers:
        for b in blockers[:5]:
            if isinstance(b, dict):
                print(f"  blocker: {b.get('code', b)}")
            else:
                print(f"  blocker: {b}")


def run_context_reads(sid: str) -> None:
    print("Step 1 — Optional radar-to-swap journey (Terminal has six tools)")
    for tool, args in (
        ("get_agent_manifest", {}),
        ("get_liq_radar", {}),
        ("get_liq_radar", {"symbol": "ETH"}),
    ):
        st, parsed = call_tool(sid, tool, args)
        text = tool_text(parsed)
        label = f"{tool}{args or ''}"
        print(f"  {label}: status={st} len={len(text)}")
        if parsed.get("result", {}).get("isError"):
            print(f"    tool error or access requirement: {text[:300]}")
            continue
        if tool == "get_liq_radar" and st == 200:
            try:
                radar = json.loads(text)
                data = radar.get("data") if isinstance(radar.get("data"), dict) else radar
                sym = data.get("symbol") or data.get("asset")
                terrain = (data.get("liq_radar") or {}).get("liq_density") or {}
                largest = terrain.get("largest_long_cluster") or terrain.get("largest_short_cluster")
                print(f"    symbol={sym} largest_cluster_snip={str(largest)[:100]}")
            except json.JSONDecodeError:
                pass


def run_swap_quote(sid: str, wallet: str, label: str) -> dict:
    st, parsed = call_tool(sid, "swap_via_nattswap", swap_args(wallet))
    text = tool_text(parsed)
    print(f"\nswap_via_nattswap ({label}): status={st}")
    data = parse_swap_payload(text)
    print_readiness(label, data)
    return data


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    parser = argparse.ArgumentParser(description="HyperNatt liq_radar -> swap demo")
    parser.add_argument(
        "--compare-vault",
        action="store_true",
        help="Quote with vault address (shows can_execute false)",
    )
    parser.add_argument(
        "--quote",
        action="store_true",
        help="Quote with AGENT_WALLET env",
    )
    args = parser.parse_args()
    agent_wallet = (os.environ.get("AGENT_WALLET") or "").strip()

    print(f"HyperNatt swap_after_liq_radar — MCP {MCP_URL}")
    try:
        sid = init_session()
    except RuntimeError as exc:
        print(f"[error] {exc}")
        return 1

    run_context_reads(sid)

    if args.compare_vault or not args.quote:
        run_swap_quote(sid, VAULT, "vault fromAddress (WRONG)")

    if args.quote:
        if not agent_wallet.startswith("0x") or len(agent_wallet) != 42:
            print("\n[error] set AGENT_WALLET=0x... for --quote")
            return 1
        data = run_swap_quote(sid, agent_wallet, "agent wallet")
        if data.get("execution_readiness", {}).get("can_execute"):
            print("\nNext: fund gas + USDC on Base, sign Li.Fi tx, POST /api/m2m/swap/register")
            print("CDP path: node examples/cdp_swap_execute.mjs --execute (VPS, keys in .env)")
        else:
            print("\nFix blockers before signing. See docs/agent-swap-demo.md")
    elif not args.compare_vault:
        print("\nTip: --compare-vault shows vault blocked; AGENT_WALLET=0x... --quote for agent path")

    print("\nNot trade advice. See SECURITY.md — vault pages are not Terminal MCP P&L.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

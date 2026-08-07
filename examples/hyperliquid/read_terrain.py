#!/usr/bin/env python3
"""HyperNatt Terminal — Hyperliquid agent: read forced-order terrain only.

READ-ONLY. This script does NOT place Hyperliquid orders, set leverage,
or call any execution SDK. Pair with YOUR HL exec tools separately
(see docs/agent-hl-sovereignty.md).

Not trade advice. No BUY/SELL verdict. We print cluster distance / OI / real liqs.

Modes:
  1) Default — interpret embedded sample (production field paths).
  2) python read_terrain.py path/to/response.json
  3) LIVE=1 — GET /api/m2m/liq-radar (x402 may return 402).

Run from public-repo root:
  python examples/hyperliquid/read_terrain.py
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any

BASE = "https://hypernatt.com"

DISCLAIMER = """\
=== HyperNatt + Hyperliquid (sovereignty) ===
- HyperNatt: READ-ONLY forced-order / liq map (this script).
- Hyperliquid: YOUR agent wallet + YOUR exec tools place orders — never this repo.
- Not trade advice. Do not treat output as a signal.
"""

SAMPLE: dict[str, Any] = {
    "ok": True,
    "product": "hypernatt_liq_radar_v1",
    "payload_schema": "hypernatt_liq_radar_v2",
    "symbol": "BTC",
    "liq_radar": {
        "available": True,
        "price_at_compute": 64894.27,
        "oi": {"delta_48h_pct": -2.43, "building": False},
        "magnet": {
            "score": -20,
            "bias": "SLIGHT_BEARISH",
            "signals": ["longs_dominant_55pct"],
        },
        "liq_density": {
            "largest_short_cluster": {
                "price": 67300,
                "size_btc": 86.2,
                "distance_pct": 3.71,
            },
            "largest_long_cluster": {
                "price": 64700,
                "size_btc": 77.3,
                "distance_pct": 0.3,
            },
            "clusters_below": [
                {"price": 64700, "size_btc": 77.3, "distance_pct": 0.3},
            ],
            "clusters_above": [
                {"price": 67300, "size_btc": 86.2, "distance_pct": 3.71},
            ],
        },
        "real_liquidations": {
            "available": True,
            "window_1h": {
                "long_liq_usd": 1356,
                "short_liq_usd": 1691077,
                "dominant": "short",
                "count": 88,
            },
        },
    },
}


def interpret(payload: dict[str, Any]) -> None:
    lr = payload.get("liq_radar") or {}
    if not lr.get("available"):
        print("liq_radar.available is false - nothing to interpret.")
        return

    price = lr.get("price_at_compute")
    dens = lr.get("liq_density") or {}
    magnet = lr.get("magnet") or {}
    oi = lr.get("oi") or {}
    real = (lr.get("real_liquidations") or {}).get("window_1h") or {}

    print(f"symbol={payload.get('symbol')} mark~={price}")
    print(
        f"magnet: score={magnet.get('score')} bias={magnet.get('bias')} "
        "(density bias - NOT a hit probability)"
    )
    print(f"OI d48h_pct={oi.get('delta_48h_pct')} building={oi.get('building')}")

    nearest = None
    for key in ("largest_long_cluster", "largest_short_cluster"):
        c = dens.get(key) or {}
        dist = c.get("distance_pct")
        if not isinstance(dist, (int, float)):
            continue
        print(
            f"{key}: price={c.get('price')} size_btc={c.get('size_btc')} "
            f"distance_pct={dist}"
        )
        if nearest is None or dist < nearest[0]:
            nearest = (dist, key, c)

    if nearest:
        dist, key, c = nearest
        print(
            f"nearest_cluster_for_context: {key} at {dist}% "
            f"(size informs risk param — not a prediction the level will hit)"
        )

    if real:
        print(
            f"real_liqs 1h: dominant={real.get('dominant')} "
            f"long_usd={real.get('long_liq_usd')} short_usd={real.get('short_liq_usd')} "
            f"count={real.get('count')}"
        )

    print()
    print("Terrain printed. Agent decides. No order sent.")


def fetch_manifest() -> None:
    req = urllib.request.Request(BASE + "/api/m2m/agent/manifest", method="GET")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        tools = data.get("tools") or data.get("mcp_tools") or []
        print(f"[manifest] ok tools_hint={len(tools) if tools else 'see JSON'}")
    except Exception as exc:
        print(f"[manifest] skip: {exc}")


def fetch_live() -> dict[str, Any] | None:
    req = urllib.request.Request(BASE + "/api/m2m/liq-radar", method="GET")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")[:300]
        print(f"[live] HTTP {exc.code} - pay via x402 (AgentKit / payments-mcp) then retry.")
        print(body)
        return None
    except Exception as exc:
        print(f"[live] error: {exc}")
        return None


def main() -> int:
    print(DISCLAIMER)
    fetch_manifest()

    if len(sys.argv) > 1:
        path = sys.argv[1]
        with open(path, encoding="utf-8") as f:
            payload = json.load(f)
        print(f"interpreting file: {path}")
        interpret(payload)
        return 0

    if os.environ.get("LIVE") == "1":
        print("LIVE=1 - fetching /api/m2m/liq-radar ...")
        payload = fetch_live()
        if not payload:
            return 2
        interpret(payload)
        return 0

    print("using embedded sample (set LIVE=1 or pass a JSON path for real data)")
    interpret(SAMPLE)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

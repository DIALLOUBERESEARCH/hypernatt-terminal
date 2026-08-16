#!/usr/bin/env python3
"""HyperNatt Terminal — honest structural read of get_liq_radar.

Uses REAL response field paths (not invented keys).
Does NOT invent Fuel Scores, sweep classifiers, or trade advice.

Modes:
  1) Default — interpret an embedded sample shaped like production.
  2) python liq_radar_interpret.py path/to/response.json — interpret a saved payload.
  3) LIVE=1 — GET /api/m2m/liq-radar (needs x402 payment; else prints 402 hint).

Run:  python examples/liq_radar_interpret.py
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any

BASE = "https://hypernatt.com"

# Minimal production-shaped sample (field paths match live get_liq_radar).
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
                {"price": 64000, "size_btc": 38.6, "distance_pct": 1.38},
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
    grammar = payload.get("cluster_grammar") or {}
    if grammar:
        print("cluster_grammar (read first):")
        print(
            f"  available={grammar.get('available')} "
            f"hold_if={grammar.get('hold_if')} "
            f"true_long={grammar.get('true_long')} "
            f"true_short={grammar.get('true_short')}"
        )
        print("  noise <3% = bait. true ~7%+ = low-leverage stack. Not a signal.")

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
        "(structural bias - NOT a hit probability)"
    )
    print(f"OI d48h_pct={oi.get('delta_48h_pct')} building={oi.get('building')}")

    for label, key in (
        ("largest_long_below/near", "largest_long_cluster"),
        ("largest_short_above/near", "largest_short_cluster"),
    ):
        c = dens.get(key) or {}
        if not c:
            continue
        dist = c.get("distance_pct")
        print(
            f"{label}: price={c.get('price')} size_btc={c.get('size_btc')} "
            f"distance_pct={dist}"
        )
        if isinstance(dist, (int, float)):
            if dist < 1:
                print(
                    "  context: cluster very close - high sweep proximity risk; "
                    "consider size/patience (not a forced entry)."
                )
            elif dist < 3:
                print("  context: cluster nearby - monitor distance vs size.")
            else:
                print("  context: cluster farther - lower immediate proximity.")

    if real:
        print(
            f"real_liqs 1h: dominant={real.get('dominant')} "
            f"long_usd={real.get('long_liq_usd')} short_usd={real.get('short_liq_usd')} "
            f"count={real.get('count')}"
        )
        print(
            "  context: if a zone was swept and real liqs spiked, cross-check OI "
            "before the next decision - still not an auto signal."
        )

    print()
    print("NOT trade advice. See README scenarios + manifest glossary_v1.")


def fetch_live() -> dict[str, Any] | None:
    req = urllib.request.Request(BASE + "/api/m2m/liq-radar", method="GET")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")[:300]
        print(f"[live] HTTP {exc.code} - pay via x402 or save a paid JSON and pass the path.")
        print(body)
        return None
    except Exception as exc:
        print(f"[live] error: {exc}")
        return None


def main() -> int:
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

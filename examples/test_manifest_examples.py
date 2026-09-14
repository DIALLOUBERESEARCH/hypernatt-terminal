"""Offline regression checks: compact/full catalogs and MCP error handling."""

import contextlib
import io
import json
import unittest
from unittest.mock import patch

import liq_radar_min
import swap_after_liq_radar
import swap_readiness_check


TOOLS = [
    "get_agent_manifest", "get_liq_radar", "swap_via_nattswap",
    "get_execution_quote", "compare_execution_context", "reconcile_execution",
]
COMPACT = {
    "version": "2.8.0", "mcp_url": "https://hypernatt.com/mcp/protocol",
    "tools": [{"name": name} for name in TOOLS],
    "journeys_v1": {"choose_by_intent": {
        "before_hyperliquid_order": "get_execution_quote",
        "swap": "swap_via_nattswap",
    }},
}
FULL = {
    "version": "2.8.0", "ecosystem": {"mcp_url": COMPACT["mcp_url"]},
    "sections": [
        {"name": "Hyperliquid execution context", "tools": []},
        {"name": "Execution", "wallet_onboarding_v1": {
            "summary_en": "Use your own signer", "prerequisites_en": ["Source gas"],
        }, "swap_execution_contract_v1": {"rules_en": ["Inspect readiness"]}},
    ],
}


class ManifestExamples(unittest.TestCase):
    def run_example(self, module, payload):
        out = io.StringIO()
        with patch.object(module, "get", return_value=payload) as get:
            with patch.dict("os.environ", {"AGENT_WALLET": ""}):
                with contextlib.redirect_stdout(out):
                    result = module.main()
        return result, out.getvalue(), get

    def test_compact_catalog_prints_actual_tools_and_journeys(self):
        result, out, get = self.run_example(liq_radar_min, COMPACT)
        self.assertEqual(result, 0)
        get.assert_called_once_with("/api/m2m/agent/manifest")
        for name in TOOLS:
            self.assertIn(name, out)
        self.assertIn("6 tools", out)
        self.assertIn(COMPACT["mcp_url"], out)
        self.assertIn("before_hyperliquid_order: get_execution_quote", out)
        self.assertNotIn("None", out)

    def test_incomplete_compact_is_not_reported_as_success(self):
        result, out, _ = self.run_example(liq_radar_min, {"version": "2.8.0"})
        self.assertEqual(result, 1)
        self.assertIn("[error]", out)

    def test_readiness_requests_full_and_finds_swap_section(self):
        result, out, get = self.run_example(swap_readiness_check, FULL)
        self.assertEqual(result, 0)
        get.assert_called_once_with("/api/m2m/agent/manifest?detail=full")
        self.assertIn("Source gas", out)
        self.assertIn("Inspect readiness", out)
        self.assertIn(COMPACT["mcp_url"], out)

    def test_missing_full_onboarding_is_an_error(self):
        result, out, _ = self.run_example(swap_readiness_check, COMPACT)
        self.assertEqual(result, 1)
        self.assertIn("[error]", out)

    def test_mcp_200_error_is_not_printed_as_radar_data(self):
        response = {"result": {"isError": True, "content": [
            {"type": "text", "text": json.dumps({"accepts": [{"network": "eip155:8453"}]})}
        ]}}
        out = io.StringIO()
        with patch.object(swap_after_liq_radar, "call_tool", return_value=(200, response)):
            with contextlib.redirect_stdout(out):
                swap_after_liq_radar.run_context_reads("offline")
        self.assertIn("tool error or access requirement", out.getvalue())
        self.assertNotIn("largest_cluster_snip", out.getvalue())

    def test_radar_uses_density_path(self):
        payload = {"symbol": "ETH", "liq_radar": {"liq_density": {
            "largest_long_cluster": {"price": 2500},
        }}}
        response = {"result": {"content": [{"type": "text", "text": json.dumps(payload)}]}}
        out = io.StringIO()
        with patch.object(swap_after_liq_radar, "call_tool", return_value=(200, response)):
            with contextlib.redirect_stdout(out):
                swap_after_liq_radar.run_context_reads("offline")
        self.assertIn("symbol=ETH largest_cluster_snip={'price': 2500}", out.getvalue())


if __name__ == "__main__":
    unittest.main()

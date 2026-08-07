import test from "node:test";
import assert from "node:assert/strict";
import {
    buildPaymentRequired,
    buildPaymentRequirements,
    summarizeSimilarityPayload,
} from "../x402-similarity.mjs";

test("similarity payment requirements use 0.001 USDC atomic", () => {
    const req = buildPaymentRequirements();
    assert.equal(req.maxAmountRequired, "1000");
    assert.equal(req.scheme, "exact");
    assert.equal(req.network, "eip155:8453");
});

test("buildPaymentRequired includes mcp_hint", () => {
    const body = buildPaymentRequired();
    assert.equal(body.x402Version, 2);
    assert.ok(body.mcp_hint.includes("get_similarity_match"));
    assert.ok(body.accepts.length >= 1);
});

test("summarizeSimilarityPayload keeps core fields", () => {
    const summary = summarizeSimilarityPayload({
        product: "hypernatt_similarity_match_v1",
        symbol: "BTCUSDT",
        issued_at: "t",
        data_available: true,
        vault_wallet: "0xabc",
        current_regime: { f21_score: 10 },
        matches: [{ rank: 1, similarity_pct: 90 }],
        corpus_stats: { snapshot_count: 100 },
        agent_reading_en: "test",
        limitations: ["a"],
        disclaimer: "d",
        methodology: { hidden: true },
    });
    assert.equal(summary.product, "hypernatt_similarity_match_v1");
    assert.equal(summary.matches.length, 1);
    assert.equal(summary.methodology, undefined);
});

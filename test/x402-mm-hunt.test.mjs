import test from "node:test";
import assert from "node:assert/strict";
import {
    buildPaymentRequired,
    buildPaymentRequirements,
    summarizeMmHuntPayload,
} from "../x402-mm-hunt.mjs";

test("mm hunt payment requirements use 0.001 USDC atomic", () => {
    const req = buildPaymentRequirements();
    assert.equal(req.maxAmountRequired, "1000");
    assert.equal(req.scheme, "exact");
    assert.equal(req.network, "eip155:8453");
});

test("buildPaymentRequired includes mcp_hint", () => {
    const body = buildPaymentRequired();
    assert.equal(body.x402Version, 2);
    assert.ok(body.mcp_hint.includes("get_mm_hunt_score"));
    assert.ok(body.accepts.length >= 1);
});

test("summarizeMmHuntPayload keeps core fields and compact inputs", () => {
    const summary = summarizeMmHuntPayload({
        product: "hypernatt_mm_hunt_score_v1",
        symbol: "BTCUSDT",
        issued_at: "t",
        data_available: true,
        mm_hunt_score: 10,
        magnet_bias: "SLIGHT_BULLISH",
        pressure_direction: "UP_HUNT_SHORTS",
        derived_fields: { pressure_direction: "magnet.bias" },
        long_trap_phase: { phase: 1 },
        alert_level: "none",
        interpretation_en: "test",
        disclaimer: "d",
        inputs: {
            oi: { delta_48h_pct: 5, building: true },
            taker: { ratio: 1.02 },
        },
    });
    assert.equal(summary.mm_hunt_score, 10);
    assert.equal(summary.derived_fields.pressure_direction, "magnet.bias");
    assert.deepEqual(summary.inputs.oi, { delta_48h_pct: 5, building: true });
});

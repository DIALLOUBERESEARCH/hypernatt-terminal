import assert from "node:assert/strict";
import test from "node:test";
import {
    buildPaymentRequired,
    buildPaymentRequirements,
    collectForbiddenSummaryKeys,
    summarizeCyclePayload,
    summarizeCyclePayloadV1,
    summarizeCyclePayloadV2,
    SIGNAL_PAYTO,
} from "../x402-signal.mjs";

const ACTIVE_FIXTURE = {
    product: "hypernatt_mimo_cycle_state_v1",
    pair: "BTC/USDC",
    has_active: true,
    issued_at: "2026-06-13T23:41:21.075Z",
    cycle: {
        direction: "LONG",
        cycle_id: "C94D4BB60",
        total_legs: 4,
        initial_entry: 73934,
        avg_entry_price: 66715.06,
        started_at: "2026-06-01T00:45:14.502990+00:00",
        chain: {
            entry_price: 63098.9,
            size: 0.06768,
            leverage: 5,
            unrealized_pnl_pct: 10.6979,
            unrealized_pnl_usd: 91.37,
            liquidation_price: 51214.35,
            take_profit_price: 75000,
        },
        checkpoint: {
            last_decision: {
                action: "HOLD",
                confidence: 100,
                timestamp: "2026-06-13T23:15:08.264408+00:00",
            },
            mfe_percentage: 2.3,
            max_drawdown_pct: -3.37,
        },
    },
    proof: {
        snapshot_hash: "sha256:abc",
        track_record: {
            url: "https://hypernatt.com/stats",
            win_rate: 0.9474,
            total_trades: 76,
        },
    },
    disclaimer: "Not a trade recommendation.",
};

test("buildPaymentRequirements uses treasury payTo", () => {
    const req = buildPaymentRequirements();
    assert.equal(req.scheme, "exact");
    assert.equal(req.network, "eip155:8453");
    assert.equal(req.payTo, SIGNAL_PAYTO);
    assert.equal(req.extra.name, "USD Coin");
    assert.match(req.maxAmountRequired, /^\d+$/);
});

test("buildPaymentRequired includes accepts", () => {
    const body = buildPaymentRequired();
    assert.equal(body.x402Version, 2);
    assert.ok(Array.isArray(body.accepts));
    assert.equal(body.accepts.length, 1);
});

test("summarizeCyclePayloadV1 excludes TP/SL fields", () => {
    const summary = summarizeCyclePayloadV1({
        product: "hypernatt_mimo_cycle_state_v1",
        has_active: true,
        cycle: { direction: "LONG", cycle_id: "c1", total_legs: 3 },
        proof: {
            snapshot_hash: "abc",
            track_record: {
                url: "https://hypernatt.com/stats",
                win_rate: 0.9459,
                total_trades: 74,
            },
        },
        disclaimer: "Not a trade recommendation.",
    });
    assert.equal(summary.direction, "LONG");
    assert.equal(summary.pair, "BTC/USDC");
    assert.equal(summary.track_record.win_rate, undefined);
    assert.equal(summary.track_record.total_trades, undefined);
    assert.equal(summary.track_record.url, "https://hypernatt.com/stats");
    assert.equal(summary.track_record.verify_yourself, "https://hypernatt.com/stats");
    assert.ok(!("tp" in summary));
    assert.ok(!("sl" in summary));
    assert.ok(!("take_profit" in summary));
});

test("summarizeCyclePayloadV2 includes interpretation_contract_v1", () => {
    const summary = summarizeCyclePayloadV2(ACTIVE_FIXTURE);
    assert.equal(summary.interpretation_contract_v1?.version, "1");
    assert.ok(summary.agent_reading_en?.includes("chain unrealized PnL"));
    assert.equal(summary.chain_snapshot?.entry_price, 63098.9);
    assert.equal(summary.chain_snapshot?.position_tp_observed, 75000);
    assert.ok(!("take_profit_price" in summary.chain_snapshot));
    assert.equal(summary.checkpoint_snapshot?.last_action, "HOLD");
    assert.equal(summary.position_accounting?.avg_entry_price, 66715.06);
});

test("summarizeCyclePayloadV2 has no forbidden keys", () => {
    const summary = summarizeCyclePayloadV2(ACTIVE_FIXTURE);
    const forbidden = collectForbiddenSummaryKeys(summary);
    assert.deepEqual(forbidden, []);
});

test("summarizeCyclePayloadV2 mirrors chain unrealized_pnl_pct", () => {
    const summary = summarizeCyclePayloadV2(ACTIVE_FIXTURE);
    assert.equal(
        summary.chain_snapshot?.unrealized_pnl_pct,
        ACTIVE_FIXTURE.cycle.chain.unrealized_pnl_pct,
    );
});

test("summarizeCyclePayload defaults to v2 when enabled", () => {
    const prev = process.env.MCP_SIGNAL_SUMMARY_V2_ENABLED;
    process.env.MCP_SIGNAL_SUMMARY_V2_ENABLED = "true";
    const summary = summarizeCyclePayload(ACTIVE_FIXTURE);
    assert.equal(summary.interpretation_contract_v1?.version, "1");
    process.env.MCP_SIGNAL_SUMMARY_V2_ENABLED = prev;
});

test("summarizeCyclePayload restores v1 when v2 disabled", () => {
    const prev = process.env.MCP_SIGNAL_SUMMARY_V2_ENABLED;
    process.env.MCP_SIGNAL_SUMMARY_V2_ENABLED = "false";
    const summary = summarizeCyclePayload(ACTIVE_FIXTURE);
    assert.ok(!("interpretation_contract_v1" in summary));
    assert.ok(!("chain_snapshot" in summary));
    assert.equal(summary.direction, "LONG");
    process.env.MCP_SIGNAL_SUMMARY_V2_ENABLED = prev;
});

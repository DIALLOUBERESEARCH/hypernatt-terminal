import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    buildAgentPaymentRequiredBlock,
    enrichPaymentRequiredPayload,
} from "../agent-payment-error.mjs";

describe("agent-payment-error.mjs F#43N", () => {
    it("enriches payment required for agents", () => {
        const out = enrichPaymentRequiredPayload(
            { x402Version: 2, error: "x", accepts: [] },
            {
                reasonCode: "FREE_TIER_EXHAUSTED",
                tool: "get_liq_radar",
                creditsRemaining: 0,
                dailyCap: 25,
            },
        );
        assert.equal(out.agent_payment_required_v1.version, "1");
        assert.equal(out.agent_payment_required_v1.reason_code, "FREE_TIER_EXHAUSTED");
        assert.ok(
            String(out.agent_payment_required_v1.human_message_en).includes(
                "get_agent_manifest",
            ),
        );
        assert.ok(
            String(out.agent_payment_required_v1.human_message_en).includes(
                "$5/mo",
            ),
        );
    });

    it("buildAgentPaymentRequiredBlock standalone", () => {
        const block = buildAgentPaymentRequiredBlock({
            reasonCode: "PAYWALL_UNAVAILABLE",
            tool: "get_liq_radar",
        });
        assert.equal(block.reason_code, "PAYWALL_UNAVAILABLE");
        assert.ok(block.free_tools_always_work.includes("get_agent_manifest"));
        assert.ok(!block.free_tools_always_work.includes("get_vault_proof"));
    });
});

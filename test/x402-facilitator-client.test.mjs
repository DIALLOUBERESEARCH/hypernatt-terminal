import assert from "node:assert/strict";
import test from "node:test";
import { verifyPaymentWithFacilitator } from "../x402-facilitator-client.mjs";

test("verifyPaymentWithFacilitator rejects when CDP keys missing", async () => {
    const prevId = process.env.CDP_API_KEY_ID;
    const prevSecret = process.env.CDP_API_KEY_SECRET;
    delete process.env.CDP_API_KEY_ID;
    delete process.env.CDP_API_KEY_SECRET;
    try {
        const out = await verifyPaymentWithFacilitator(
            { x402Version: 2, scheme: "exact" },
            { scheme: "exact", network: "eip155:8453" },
        );
        assert.equal(out.isValid, false);
        assert.match(out.error || "", /CDP_API_KEY/);
    } finally {
        if (prevId !== undefined) process.env.CDP_API_KEY_ID = prevId;
        if (prevSecret !== undefined) process.env.CDP_API_KEY_SECRET = prevSecret;
    }
});

test("verifyPaymentWithFacilitator accepts VRP sim receipt", async () => {
    const out = await verifyPaymentWithFacilitator(
        { receipt: "X402-VRP-test", x402Version: 2 },
        { scheme: "exact" },
    );
    assert.equal(out.isValid, true);
});

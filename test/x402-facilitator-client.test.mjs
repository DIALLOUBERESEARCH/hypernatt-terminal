import assert from "node:assert/strict";
import test from "node:test";
import {
    settlePaymentWithFacilitator,
    verifyPaymentWithFacilitator,
} from "../x402-facilitator-client.mjs";

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

// F#440: a self-written "X402-VRP-" receipt was accepted as paid. It must now
// go to the facilitator like any payload, so without CDP keys it is refused.
for (const receipt of ["X402-VRP-test", "X402-VRP-forged", "X402-VRP-"]) {
    test(`forged receipt ${receipt} is neither verified nor settled`, async () => {
        const prevId = process.env.CDP_API_KEY_ID;
        const prevSecret = process.env.CDP_API_KEY_SECRET;
        delete process.env.CDP_API_KEY_ID;
        delete process.env.CDP_API_KEY_SECRET;
        try {
            const payload = { receipt, x402Version: 2, simulated: true };
            const verified = await verifyPaymentWithFacilitator(payload, { scheme: "exact" });
            assert.equal(verified.isValid, false);
            const settled = await settlePaymentWithFacilitator(payload, { scheme: "exact" });
            assert.equal(settled.success, false);
            assert.equal(settled.simulated, undefined);
        } finally {
            if (prevId !== undefined) process.env.CDP_API_KEY_ID = prevId;
            if (prevSecret !== undefined) process.env.CDP_API_KEY_SECRET = prevSecret;
        }
    });
}

test("no payment path keeps a simulated-receipt shortcut", async () => {
    const { existsSync, readFileSync } = await import("node:fs");
    // The middleware lives in the private monorepo only; the public mirror checks its own file.
    for (const file of [
        new URL("../x402-facilitator-client.mjs", import.meta.url),
        new URL("../../middleware/x402.middleware.ts", import.meta.url),
    ].filter(existsSync)) {
        assert.doesNotMatch(readFileSync(file, "utf8"), /X402-VRP-/);
    }
});

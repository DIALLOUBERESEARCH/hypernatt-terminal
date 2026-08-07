import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createSettlementCache, paymentDigestFromPayload } from "../x402-settlement-cache.mjs";

describe("x402-settlement-cache F85N", () => {
  it("PROP-1: only one beginSettle per digest until complete", () => {
    const cache = createSettlementCache({ ttlMs: 60_000, now: () => 1_000 });
    const digest = paymentDigestFromPayload({ x: 1 });
    assert.equal(cache.beginSettle(digest).allow, true);
    assert.equal(cache.beginSettle(digest).allow, false);
    cache.completeSettle(digest, "tx1");
    assert.equal(cache.beginSettle(digest).allow, false);
  });
});

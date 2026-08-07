import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertSessionClient,
  clientKeyFromRequest,
  registerSessionClient,
} from "../mcp-session-bind.mjs";

describe("mcp-session-bind F85N", () => {
  it("rejects client key mismatch", () => {
    const store = new Map();
    registerSessionClient(store, "sess-1", clientKeyFromRequest({ ip: "1.2.3.4", userAgent: "a" }));
    assert.equal(
      assertSessionClient(store, "sess-1", clientKeyFromRequest({ ip: "1.2.3.4", userAgent: "b" })),
      false,
    );
  });
});

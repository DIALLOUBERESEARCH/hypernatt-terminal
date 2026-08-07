import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    bindActiveSessionCounter,
    buildStaleSessionBody,
    isStaleMcpSession,
    recordSessionClosed,
    recordSessionCreated,
    recordStaleSessionRejected,
    resetMcpSessionStatsForTests,
    staleSessionHttpStatus,
    getMcpSessionStats,
} from "../mcp-session-resilience.mjs";

describe("mcp-session-resilience.mjs F#45N", () => {
    it("detects stale session when id missing from transports map", () => {
        const transports = new Map([["live-id", {}]]);
        assert.equal(isStaleMcpSession("live-id", transports), false);
        assert.equal(isStaleMcpSession("dead-id", transports), true);
        assert.equal(isStaleMcpSession("", transports), false);
        assert.equal(isStaleMcpSession(undefined, transports), false);
    });

    it("returns 404 status per MCP spec", () => {
        assert.equal(staleSessionHttpStatus(), 404);
    });

    it("builds agent-friendly stale body with reinitialize action", () => {
        const body = buildStaleSessionBody("abc12345-dead-beef");
        assert.equal(body.code, "MCP_SESSION_STALE");
        assert.equal(body.action, "reinitialize");
        assert.equal(body.session_id_prefix, "abc12345");
    });

    it("tracks lifecycle counters", () => {
        resetMcpSessionStatsForTests();
        bindActiveSessionCounter(() => 2);
        recordSessionCreated();
        recordSessionClosed("transport_close");
        recordStaleSessionRejected();
        const snap = getMcpSessionStats();
        assert.equal(snap.sessions_active, 2);
        assert.equal(snap.sessions_created_total, 1);
        assert.equal(snap.sessions_closed_total, 1);
        assert.equal(snap.stale_rejected_total, 1);
        assert.equal(snap.close_reasons.transport_close, 1);
    });
});

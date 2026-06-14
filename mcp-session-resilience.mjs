/**
 * F#45N — MCP Streamable HTTP session resilience (spec §Session Management).
 *
 * When a client sends a stale Mcp-Session-Id (container restart, transport close),
 * respond HTTP 404 without Mcp-Session-Id so compliant clients re-initialize.
 */

/** @type {{ created: number; closed: number; staleRejected: number; closeReasons: Record<string, number> }} */
const stats = {
    created: 0,
    closed: 0,
    staleRejected: 0,
    closeReasons: {},
};

/** @type {() => number} */
let activeSessionCountFn = () => 0;

/**
 * @param {() => number} fn
 */
export function bindActiveSessionCounter(fn) {
    activeSessionCountFn = fn;
}

/**
 * @param {unknown} sessionId
 * @param {Map<string, unknown>} transports
 */
export function isStaleMcpSession(sessionId, transports) {
    if (sessionId === undefined || sessionId === null) {
        return false;
    }
    const id = String(sessionId).trim();
    if (!id) {
        return false;
    }
    return !transports.has(id);
}

export function staleSessionHttpStatus() {
    return 404;
}

/**
 * @param {string} sessionId
 */
export function buildStaleSessionBody(sessionId) {
    const prefix = String(sessionId).slice(0, 8);
    return {
        error: "session_not_found",
        code: "MCP_SESSION_STALE",
        message:
            "MCP session expired or the server restarted. Discard Mcp-Session-Id and send a new initialize request (MCP Streamable HTTP session management).",
        action: "reinitialize",
        session_id_prefix: prefix || null,
    };
}

/**
 * Spec: 404 with no Mcp-Session-Id header = client MUST reinitialize.
 *
 * @param {import('express').Response} res
 * @param {string} sessionId
 */
export function respondStaleSession(res, sessionId) {
    recordStaleSessionRejected();
    res.status(staleSessionHttpStatus()).json(buildStaleSessionBody(sessionId));
}

export function recordSessionCreated() {
    stats.created += 1;
}

/**
 * @param {string} [reason]
 */
export function recordSessionClosed(reason = "transport_close") {
    stats.closed += 1;
    const key = String(reason || "unknown").slice(0, 64);
    stats.closeReasons[key] = (stats.closeReasons[key] || 0) + 1;
}

export function recordStaleSessionRejected() {
    stats.staleRejected += 1;
}

export function getMcpSessionStats() {
    return {
        version: "1",
        sessions_active: activeSessionCountFn(),
        sessions_created_total: stats.created,
        sessions_closed_total: stats.closed,
        stale_rejected_total: stats.staleRejected,
        close_reasons: { ...stats.closeReasons },
    };
}

export function resetMcpSessionStatsForTests() {
    stats.created = 0;
    stats.closed = 0;
    stats.staleRejected = 0;
    stats.closeReasons = {};
    activeSessionCountFn = () => 0;
}

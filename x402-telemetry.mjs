/**
 * F#32N — x402 funnel telemetry client (mcp-server container).
 *
 * The MCP container has no Postgres access: events are forwarded to
 * m2m-service via the internal endpoint. Fire-and-forget + fail-open —
 * telemetry must NEVER slow down or break a tool call.
 */
import axios from "axios";

const M2M_URL = process.env.M2M_SERVICE_URL || "http://m2m-service:8010";
const INTERNAL_SECRET =
    process.env.M2M_INTERNAL_SECRET ||
    process.env.NATTSQUARE_INTERNAL_SECRET ||
    "";
const TELEMETRY_ENABLED = process.env.M2M_X402_TELEMETRY_ENABLED !== "false";

/**
 * Extract the payer wallet from an x402 payment payload.
 * EVM (EIP-3009 exact) nests it under payload.authorization.from -> lowercased.
 * F#68O — Solana (SVM) fallback: base58 payer, CASE PRESERVED (lowercasing a
 * base58 address corrupts it). Best-effort across common payer fields.
 */
const SOLANA_WALLET_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function isSolWallet(v) {
    return typeof v === "string" && SOLANA_WALLET_RE.test(v.trim());
}

export function extractPayerWallet(paymentPayload) {
    if (!paymentPayload || typeof paymentPayload !== "object") return null;
    const direct =
        paymentPayload.from || paymentPayload.payer || paymentPayload.sender;
    if (typeof direct === "string" && /^0x[0-9a-fA-F]{40}$/.test(direct)) {
        return direct.toLowerCase();
    }
    const auth = paymentPayload.payload?.authorization;
    if (auth && typeof auth.from === "string" && /^0x[0-9a-fA-F]{40}$/.test(auth.from)) {
        return auth.from.toLowerCase();
    }
    // Solana fallback (case preserved).
    const nested = paymentPayload.payload || {};
    const cands = [
        paymentPayload.from,
        paymentPayload.payer,
        paymentPayload.sender,
        paymentPayload.account,
        paymentPayload.authority,
        paymentPayload.owner,
        nested.from,
        nested.payer,
        nested.account,
        auth?.from,
    ];
    for (const c of cands) {
        if (isSolWallet(c)) return c;
    }
    return null;
}

/**
 * F#68O — which rail the buyer used (CAIP-2). The MCP path passes
 * paymentPayload.accepted (the chosen requirement) to verify/settle, so the
 * network lives there; fall back to a top-level network field. Null if unknown.
 */
export function networkFromPayload(paymentPayload) {
    if (!paymentPayload || typeof paymentPayload !== "object") return null;
    const accepted = paymentPayload.accepted;
    if (accepted && typeof accepted.network === "string") return accepted.network;
    if (typeof paymentPayload.network === "string") return paymentPayload.network;
    return null;
}

/**
 * Record a funnel event. Never throws, never blocks.
 * event_type: discovery | 402_shown | payment_invalid | payment_verified | payment_settled
 */
export function recordX402Event(event) {
    if (!TELEMETRY_ENABLED || !INTERNAL_SECRET) return;
    const url = `${M2M_URL.replace(/\/$/, "")}/api/m2m/internal/x402-event`;
    axios
        .post(
            url,
            {
                transport: "mcp",
                ...event,
            },
            {
                headers: {
                    "X-M2M-Internal-Secret": INTERNAL_SECRET,
                    "Content-Type": "application/json",
                },
                timeout: 5000,
            },
        )
        .catch((err) => {
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`[F#32N] telemetry post failed (fail-open): ${message}`);
        });
}

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
 * Extract the payer wallet from an x402 payment payload (EIP-3009 exact
 * scheme nests it under payload.authorization.from).
 */
export function extractPayerWallet(paymentPayload) {
    if (!paymentPayload || typeof paymentPayload !== "object") return null;
    const direct =
        paymentPayload.from || paymentPayload.payer || paymentPayload.sender;
    if (typeof direct === "string" && direct) return direct.toLowerCase();
    const auth = paymentPayload.payload?.authorization;
    if (auth && typeof auth.from === "string" && auth.from) {
        return auth.from.toLowerCase();
    }
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

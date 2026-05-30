/**
 * F#22 — x402 helpers for MCP get_btc_usdc_signal (CDP facilitator, same as m2m middleware).
 */
import axios from "axios";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;
const BASE_MAINNET = "eip155:8453";

const CDP_FACILITATOR_URL =
    process.env.X402_FACILITATOR_URL ||
    "https://api.cdp.coinbase.com/platform/v2/x402";

export const SIGNAL_PRICE_USDC = parseFloat(
    process.env.MIMO_SIGNAL_X402_PRICE_USDC || "0.01",
);

export const SIGNAL_PAYTO = (
    process.env.MIMO_SIGNAL_X402_PAYTO ||
    process.env.NATT_AGENT_WALLET ||
    "0x467179313f81ff63fde6fc6ebb5188eddbeedf3b"
).toLowerCase();

const SIGNAL_DESCRIPTION =
    "HyperNatt Mimo BTC/USDC live cycle state via MCP (verifiable, not a trade signal)";

function usdcAtomic(priceUsdc) {
    return String(Math.round(priceUsdc * 10 ** USDC_DECIMALS));
}

export function buildPaymentRequirements() {
    const priceLabel = `$${SIGNAL_PRICE_USDC.toFixed(2)}`;
    return {
        scheme: "exact",
        network: BASE_MAINNET,
        maxAmountRequired: usdcAtomic(SIGNAL_PRICE_USDC),
        payTo: SIGNAL_PAYTO,
        maxTimeoutSeconds: 60,
        asset: USDC_ADDRESS,
        extra: { name: "USDC", version: "2", decimals: USDC_DECIMALS },
        resource: SIGNAL_DESCRIPTION,
        description: `Pay ${priceLabel} USDC on Base to access: ${SIGNAL_DESCRIPTION}`,
        mimeType: "application/json",
    };
}

export function buildPaymentRequired(extraError) {
    return {
        x402Version: 2,
        error:
            extraError ||
            `X-PAYMENT required. Pay $${SIGNAL_PRICE_USDC.toFixed(2)} USDC on Base (treasury ${SIGNAL_PAYTO}).`,
        accepts: [buildPaymentRequirements()],
        mcp_hint:
            "Retry get_btc_usdc_signal with x_payment (base64 JSON payment payload) or send X-Payment header on POST /messages.",
    };
}

export function parsePaymentHeader(raw) {
    if (!raw) {
        throw new Error("missing");
    }
    const paymentHeader = Array.isArray(raw) ? raw[0] : raw;
    try {
        return JSON.parse(
            Buffer.from(paymentHeader, "base64").toString("utf-8"),
        );
    } catch {
        const hex = String(paymentHeader).trim();
        if (/^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0) {
            return JSON.parse(Buffer.from(hex, "hex").toString("utf-8"));
        }
        throw new Error("invalid format");
    }
}

export async function verifyPayment(paymentPayload) {
    const paymentRequirements = buildPaymentRequirements();
    const sim = paymentPayload;
    if (sim && typeof sim.receipt === "string" && sim.receipt.startsWith("X402-VRP-")) {
        return { isValid: true };
    }
    try {
        const response = await axios.post(
            `${CDP_FACILITATOR_URL}/verify`,
            { x402Version: 2, paymentPayload, paymentRequirements },
            { headers: { "Content-Type": "application/json" }, timeout: 10000 },
        );
        if (response.data?.isValid) {
            return { isValid: true };
        }
        return {
            isValid: false,
            error: response.data?.invalidReason || "Payment verification failed",
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { isValid: false, error: message };
    }
}

export async function fetchSignalPayload(m2mBaseUrl, internalSecret) {
    const url = `${m2mBaseUrl.replace(/\/$/, "")}/api/m2m/internal/signal`;
    const response = await axios.get(url, {
        headers: {
            "X-M2M-Internal-Secret": internalSecret,
            Accept: "application/json",
        },
        timeout: 15000,
    });
    return response.data;
}

/** Compact summary for agents — no TP/SL (F#21 product contract). */
export function summarizeCyclePayload(payload) {
    const cycle = payload?.cycle || {};
    const proof = payload?.proof || {};
    const track = proof.track_record || {};
    return {
        product: payload?.product,
        pair: payload?.pair ?? "BTC/USDC",
        has_active: payload?.has_active,
        issued_at: payload?.issued_at,
        direction: cycle.direction ?? null,
        cycle_id: cycle.cycle_id ?? null,
        total_legs: cycle.total_legs ?? null,
        idle: payload?.idle ?? null,
        track_record: {
            url: track.url,
            win_rate: track.win_rate,
            total_trades: track.total_trades,
        },
        proof_snapshot_hash: proof.snapshot_hash,
        verification_url: track.url || "https://hypernatt.com/stats",
        disclaimer:
            payload?.disclaimer ||
            "Live verifiable Mimo cycle state only. Not a trade recommendation.",
    };
}

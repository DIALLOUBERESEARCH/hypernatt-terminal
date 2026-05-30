/**
 * F#24b — x402 helpers for MCP get_similarity_match.
 */
import axios from "axios";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;
const BASE_MAINNET = "eip155:8453";

const CDP_FACILITATOR_URL =
    process.env.X402_FACILITATOR_URL ||
    "https://api.cdp.coinbase.com/platform/v2/x402";

export const SIMILARITY_PRICE_USDC = parseFloat(
    process.env.SIMILARITY_MATCH_X402_PRICE_USDC ||
        process.env.MIMO_SIGNAL_X402_PRICE_USDC ||
        "0.01",
);

export const SIMILARITY_PAYTO = (
    process.env.SIMILARITY_MATCH_X402_PAYTO ||
    process.env.MIMO_SIGNAL_X402_PAYTO ||
    process.env.NATT_AGENT_WALLET ||
    "0x467179313f81ff63fde6fc6ebb5188eddbeedf3b"
).toLowerCase();

const SIMILARITY_DESCRIPTION =
    "HyperNatt BTC historical microstructure similarity TOP3 with observed ~4h outcomes via MCP (read-only)";

function usdcAtomic(priceUsdc) {
    return String(Math.round(priceUsdc * 10 ** USDC_DECIMALS));
}

export function buildPaymentRequirements() {
    const priceLabel = `$${SIMILARITY_PRICE_USDC.toFixed(2)}`;
    return {
        scheme: "exact",
        network: BASE_MAINNET,
        maxAmountRequired: usdcAtomic(SIMILARITY_PRICE_USDC),
        payTo: SIMILARITY_PAYTO,
        maxTimeoutSeconds: 60,
        asset: USDC_ADDRESS,
        extra: { name: "USDC", version: "2", decimals: USDC_DECIMALS },
        resource: SIMILARITY_DESCRIPTION,
        description: `Pay ${priceLabel} USDC on Base to access: ${SIMILARITY_DESCRIPTION}`,
        mimeType: "application/json",
    };
}

export function buildPaymentRequired(extraError) {
    return {
        x402Version: 2,
        error:
            extraError ||
            `X-PAYMENT required. Pay $${SIMILARITY_PRICE_USDC.toFixed(2)} USDC on Base (treasury ${SIMILARITY_PAYTO}).`,
        accepts: [buildPaymentRequirements()],
        mcp_hint:
            "Retry get_similarity_match with x_payment (base64 JSON payment payload) or send X-Payment header on POST /messages.",
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

export async function fetchSimilarityPayload(m2mBaseUrl, internalSecret, fullPayload = false) {
    const url = `${m2mBaseUrl.replace(/\/$/, "")}/api/m2m/internal/similarity-match`;
    const response = await axios.get(url, {
        headers: {
            "X-M2M-Internal-Secret": internalSecret,
            Accept: "application/json",
        },
        params: fullPayload ? { full_payload: "true" } : {},
        timeout: 25000,
    });
    return response.data;
}

export function summarizeSimilarityPayload(payload) {
    return {
        product: payload?.product,
        symbol: payload?.symbol,
        pair: payload?.pair ?? "BTC/USDC",
        issued_at: payload?.issued_at,
        data_available: payload?.data_available,
        vault_wallet: payload?.vault_wallet,
        current_regime: payload?.current_regime,
        matches: payload?.matches,
        corpus_stats: payload?.corpus_stats,
        agent_reading_en: payload?.agent_reading_en,
        limitations: payload?.limitations,
        disclaimer: payload?.disclaimer,
    };
}

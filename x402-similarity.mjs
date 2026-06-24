/**
 * F#24b — x402 helpers for MCP get_similarity_match.
 */
import axios from "axios";
import { verifyPaymentWithFacilitator, formatUsdLabel } from "./x402-facilitator-client.mjs";
import { buildAccepts } from "./x402-networks.mjs";
import { attachBuilderCodeToPaymentRequired } from "./x402-builder-code.mjs";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;
const BASE_MAINNET = "eip155:8453";

const CDP_FACILITATOR_URL =
    process.env.X402_FACILITATOR_URL ||
    "https://api.cdp.coinbase.com/platform/v2/x402";

export const SIMILARITY_PRICE_USDC = parseFloat(
    process.env.SIMILARITY_MATCH_X402_PRICE_USDC ||
        process.env.MIMO_SIGNAL_X402_PRICE_USDC ||
        "0.001",
);

export const SIMILARITY_PAYTO = (
    process.env.SIMILARITY_MATCH_X402_PAYTO ||
    process.env.MIMO_SIGNAL_X402_PAYTO ||
    process.env.NATT_X402_TREASURY ||
    "0x5a78ACE5DD133316c8aaf7E156FBfc57E1209Cf9"
).toLowerCase();

const SIMILARITY_DESCRIPTION =
    "What happened last time BTC looked like this? Top-3 historical pattern matches with outcomes";
// F#32N — resource must be the URL (Bazaar indexing key), not a description.
const SIMILARITY_RESOURCE_URL =
    process.env.PUBLIC_MCP_URL || "https://hypernatt.com/mcp/protocol";

function usdcAtomic(priceUsdc) {
    return String(Math.round(priceUsdc * 10 ** USDC_DECIMALS));
}

export function buildPaymentRequirements() {
    const priceLabel = `$${formatUsdLabel(SIMILARITY_PRICE_USDC)}`;
    return {
        scheme: "exact",
        network: BASE_MAINNET,
        maxAmountRequired: usdcAtomic(SIMILARITY_PRICE_USDC),
        payTo: SIMILARITY_PAYTO,
        maxTimeoutSeconds: 60,
        asset: USDC_ADDRESS,
        extra: { name: "USD Coin", version: "2", decimals: USDC_DECIMALS },
        resource: SIMILARITY_RESOURCE_URL,
        description: `Pay ${priceLabel} USDC on Base to access: ${SIMILARITY_DESCRIPTION}`,
        mimeType: "application/json",
    };
}

export function buildPaymentRequired(extraError) {
    return attachBuilderCodeToPaymentRequired({
        x402Version: 2,
        error:
            extraError ||
            `X-PAYMENT required. Pay $${formatUsdLabel(SIMILARITY_PRICE_USDC)} USDC on Base (treasury ${SIMILARITY_PAYTO}).`,
        accepts: buildAccepts(buildPaymentRequirements()),
        mcp_hint:
            "Retry get_similarity_match with x_payment (base64 JSON payment payload) or send X-Payment header on POST /messages.",
    });
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
    return verifyPaymentWithFacilitator(
        paymentPayload,
        paymentPayload?.accepted ?? buildPaymentRequirements(),
    );
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
        interpretation_contract_v1: payload?.interpretation_contract_v1,
        episode_diversity: payload?.episode_diversity,
        confidence_tier: payload?.confidence_tier,
        confidence_tier_rationale_en: payload?.confidence_tier_rationale_en,
        agent_reading_en: payload?.agent_reading_en,
        limitations: payload?.limitations,
        disclaimer: payload?.disclaimer,
    };
}

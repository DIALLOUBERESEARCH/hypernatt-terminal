/**
 * F#23 — x402 helpers for MCP get_mm_hunt_score.
 */
import axios from "axios";
import { verifyPaymentWithFacilitator } from "./x402-facilitator-client.mjs";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;
const BASE_MAINNET = "eip155:8453";

const CDP_FACILITATOR_URL =
    process.env.X402_FACILITATOR_URL ||
    "https://api.cdp.coinbase.com/platform/v2/x402";

export const MM_HUNT_PRICE_USDC = parseFloat(
    process.env.MM_HUNT_X402_PRICE_USDC ||
        process.env.MIMO_SIGNAL_X402_PRICE_USDC ||
        "0.01",
);

export const MM_HUNT_PAYTO = (
    process.env.MM_HUNT_X402_PAYTO ||
    process.env.MIMO_SIGNAL_X402_PAYTO ||
    process.env.NATT_X402_TREASURY ||
    "0x5a78ACE5DD133316c8aaf7E156FBfc57E1209Cf9"
).toLowerCase();

const MM_HUNT_DESCRIPTION =
    "Is the Market Maker hunting your position? Live liquidation pressure score — avoid being exit liquidity";
// F#32N — resource must be the URL (Bazaar indexing key), not a description.
const MM_HUNT_RESOURCE_URL =
    process.env.PUBLIC_MCP_URL || "https://hypernatt.com/mcp/protocol";

const DERIVED_FIELDS = { pressure_direction: "magnet.bias" };

function usdcAtomic(priceUsdc) {
    return String(Math.round(priceUsdc * 10 ** USDC_DECIMALS));
}

export function buildPaymentRequirements() {
    const priceLabel = `$${MM_HUNT_PRICE_USDC.toFixed(2)}`;
    return {
        scheme: "exact",
        network: BASE_MAINNET,
        maxAmountRequired: usdcAtomic(MM_HUNT_PRICE_USDC),
        payTo: MM_HUNT_PAYTO,
        maxTimeoutSeconds: 60,
        asset: USDC_ADDRESS,
        extra: { name: "USD Coin", version: "2", decimals: USDC_DECIMALS },
        resource: MM_HUNT_RESOURCE_URL,
        description: `Pay ${priceLabel} USDC on Base to access: ${MM_HUNT_DESCRIPTION}`,
        mimeType: "application/json",
    };
}

export function buildPaymentRequired(extraError) {
    return {
        x402Version: 2,
        error:
            extraError ||
            `X-PAYMENT required. Pay $${MM_HUNT_PRICE_USDC.toFixed(2)} USDC on Base (treasury ${MM_HUNT_PAYTO}).`,
        accepts: [buildPaymentRequirements()],
        mcp_hint:
            "Retry get_mm_hunt_score with x_payment (base64 JSON payment payload) or send X-Payment header on POST /messages.",
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
    return verifyPaymentWithFacilitator(
        paymentPayload,
        paymentPayload?.accepted ?? buildPaymentRequirements(),
    );
}

export async function fetchMmHuntPayload(m2mBaseUrl, internalSecret, fullPayload = false) {
    const url = `${m2mBaseUrl.replace(/\/$/, "")}/api/m2m/internal/mm-hunt`;
    const response = await axios.get(url, {
        headers: {
            "X-M2M-Internal-Secret": internalSecret,
            Accept: "application/json",
        },
        params: fullPayload ? { full_payload: "true" } : {},
        timeout: 20000,
    });
    return response.data;
}

function compactSummaryInputs(inputs) {
    if (!inputs || typeof inputs !== "object") return {};
    const out = {};
    if (inputs.oi) {
        out.oi = {
            delta_48h_pct: inputs.oi.delta_48h_pct ?? null,
            building: inputs.oi.building ?? null,
        };
    }
    if (inputs.funding) {
        out.funding = {
            latest_rate_pct: inputs.funding.latest_rate_pct ?? null,
            shorts_paying_dominant: inputs.funding.shorts_paying_dominant ?? null,
        };
    }
    if (inputs.taker) {
        out.taker = { ratio: inputs.taker.ratio ?? null };
    }
    if (inputs.ls_ratio) {
        out.ls_ratio = {
            long_pct: inputs.ls_ratio.long_pct ?? null,
            short_pct: inputs.ls_ratio.short_pct ?? null,
        };
    }
    if (inputs.hlp_vault) {
        out.hlp_vault = {
            size_btc: inputs.hlp_vault.size_btc ?? null,
            side: inputs.hlp_vault.side ?? null,
        };
    }
    return out;
}

/** Default agent payload: core + compact inputs (internal route already summarizes). */
export function summarizeMmHuntPayload(payload) {
    const compactInputs = compactSummaryInputs(payload?.inputs);
    const summary = {
        product: payload?.product,
        symbol: payload?.symbol,
        pair: payload?.pair ?? "BTC/USDC",
        issued_at: payload?.issued_at,
        data_available: payload?.data_available,
        mm_hunt_score: payload?.mm_hunt_score,
        magnet_bias: payload?.magnet_bias,
        pressure_direction: payload?.pressure_direction,
        derived_fields: payload?.derived_fields ?? DERIVED_FIELDS,
        long_trap_phase: payload?.long_trap_phase,
        alert_level: payload?.alert_level,
        interpretation_en: payload?.interpretation_en,
        disclaimer: payload?.disclaimer,
    };
    if (Object.keys(compactInputs).length > 0) {
        summary.inputs = compactInputs;
    }
    return summary;
}

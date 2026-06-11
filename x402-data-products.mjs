/**
 * F#33N — x402 helpers for MCP get_liq_radar + get_mm_trap_state.
 *
 * Generic factory: both tools share the same payment/fetch shape, only
 * price env, payTo env, internal route and description differ.
 */
import axios from "axios";
import { verifyPaymentWithFacilitator } from "./x402-facilitator-client.mjs";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;
const BASE_MAINNET = "eip155:8453";

const MCP_RESOURCE_URL =
    process.env.PUBLIC_MCP_URL || "https://hypernatt.com/mcp/protocol";

const DEFAULT_TREASURY = (
    process.env.MIMO_SIGNAL_X402_PAYTO ||
    process.env.NATT_X402_TREASURY ||
    "0x5a78ACE5DD133316c8aaf7E156FBfc57E1209Cf9"
).toLowerCase();

function usdcAtomic(priceUsdc) {
    return String(Math.round(priceUsdc * 10 ** USDC_DECIMALS));
}

function parsePaymentHeader(raw) {
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

/**
 * Build the x402 helper set for one data product.
 * @param {object} cfg
 * @param {string} cfg.toolName        MCP tool name (telemetry key)
 * @param {string} cfg.priceEnv        env var for price override
 * @param {string} cfg.payToEnv        env var for payTo override
 * @param {string} cfg.description     short paywall description
 * @param {string} cfg.internalPath    m2m internal route path
 */
export function createDataProductX402(cfg) {
    const priceUsdc = parseFloat(
        process.env[cfg.priceEnv] ||
            process.env.MIMO_SIGNAL_X402_PRICE_USDC ||
            "0.01",
    );
    const payTo = (process.env[cfg.payToEnv] || DEFAULT_TREASURY).toLowerCase();

    function buildPaymentRequirements() {
        const priceLabel = `$${priceUsdc.toFixed(2)}`;
        return {
            scheme: "exact",
            network: BASE_MAINNET,
            maxAmountRequired: usdcAtomic(priceUsdc),
            payTo,
            maxTimeoutSeconds: 60,
            asset: USDC_ADDRESS,
            extra: { name: "USD Coin", version: "2", decimals: USDC_DECIMALS },
            resource: MCP_RESOURCE_URL,
            description: `Pay ${priceLabel} USDC on Base to access: ${cfg.description}`,
            mimeType: "application/json",
        };
    }

    function buildPaymentRequired(extraError) {
        return {
            x402Version: 2,
            error:
                extraError ||
                `X-PAYMENT required. Pay $${priceUsdc.toFixed(2)} USDC on Base (treasury ${payTo}).`,
            accepts: [buildPaymentRequirements()],
            mcp_hint: `Retry ${cfg.toolName} with x_payment (base64 JSON payment payload) or send X-Payment header on POST /messages.`,
        };
    }

    async function verifyPayment(paymentPayload) {
        return verifyPaymentWithFacilitator(
            paymentPayload,
            paymentPayload?.accepted ?? buildPaymentRequirements(),
        );
    }

    async function fetchPayload(m2mBaseUrl, internalSecret) {
        const url = `${m2mBaseUrl.replace(/\/$/, "")}${cfg.internalPath}`;
        const response = await axios.get(url, {
            headers: {
                "X-M2M-Internal-Secret": internalSecret,
                Accept: "application/json",
            },
            timeout: 25000,
        });
        return response.data;
    }

    return {
        priceUsdc,
        payTo,
        buildPaymentRequirements,
        buildPaymentRequired,
        parsePaymentHeader,
        verifyPayment,
        fetchPayload,
    };
}

export const LIQ_RADAR_X402 = createDataProductX402({
    toolName: "get_liq_radar",
    priceEnv: "LIQ_RADAR_X402_PRICE_USDC",
    payToEnv: "LIQ_RADAR_X402_PAYTO",
    description:
        "HyperNatt BTC liquidation radar — raw microstructure snapshot via MCP (read-only)",
    internalPath: "/api/m2m/internal/liq-radar",
});

export const MM_TRAP_STATE_X402 = createDataProductX402({
    toolName: "get_mm_trap_state",
    priceEnv: "MM_TRAP_STATE_X402_PRICE_USDC",
    payToEnv: "MM_TRAP_STATE_X402_PAYTO",
    description:
        "HyperNatt BTC MM trap state — live manipulation weather via MCP (read-only, redacted)",
    internalPath: "/api/m2m/internal/mm-trap-state",
});

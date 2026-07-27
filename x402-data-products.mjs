/**
 * F#33N — x402 helpers for MCP get_liq_radar + get_mm_trap_state.
 *
 * Generic factory: both tools share the same payment/fetch shape, only
 * price env, payTo env, internal route and description differ.
 */
import axios from "axios";
import { verifyPaymentWithFacilitator, formatUsdLabel } from "./x402-facilitator-client.mjs";
import { buildAccepts } from "./x402-networks.mjs";
import { attachBuilderCodeToPaymentRequired } from "./x402-builder-code.mjs";

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
            "0.001",
    );
    const payTo = (process.env[cfg.payToEnv] || DEFAULT_TREASURY).toLowerCase();

    function buildPaymentRequirements() {
        const priceLabel = `$${formatUsdLabel(priceUsdc)}`;
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
        return attachBuilderCodeToPaymentRequired({
            x402Version: 2,
            error:
                extraError ||
                `X-PAYMENT required. Pay $${formatUsdLabel(priceUsdc)} USDC on Base (treasury ${payTo}).`,
            accepts: buildAccepts(buildPaymentRequirements()),
            mcp_hint: `Retry ${cfg.toolName} with x_payment (base64 JSON payment payload) or send X-Payment header on POST /messages.`,
        });
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
        "Where will the next BTC liquidation cascade hit? Raw cluster data via MCP",
    internalPath: "/api/m2m/internal/liq-radar",
});

export const MM_TRAP_STATE_X402 = createDataProductX402({
    toolName: "get_mm_trap_state",
    priceEnv: "MM_TRAP_STATE_X402_PRICE_USDC",
    payToEnv: "MM_TRAP_STATE_X402_PAYTO",
    description:
        "Live Market Maker manipulation weather — trap/sweep/reclaim detection via MCP",
    internalPath: "/api/m2m/internal/mm-trap-state",
});

/** F58N — trading hub + slices (shared price/payTo env). */
function createF58nProduct(toolName, description, internalPath) {
    return createDataProductX402({
        toolName,
        priceEnv: "F58N_TRADING_HUB_X402_PRICE_USDC",
        payToEnv: "F58N_TRADING_HUB_X402_PAYTO",
        description,
        internalPath,
    });
}

export const TRADING_HUB_X402 = createF58nProduct(
    "get_trading_hub",
    "One-stop BTC trading context (TA + orderflow + liq both sides + hunt + regime)",
    "/api/m2m/internal/trading-hub",
);

export const TA_SNAPSHOT_X402 = createF58nProduct(
    "get_ta_snapshot",
    "BTC TA snapshot (RSI/MACD/ADX/ATR/VWAP)",
    "/api/m2m/internal/ta-snapshot",
);

export const ORDERFLOW_X402 = createF58nProduct(
    "get_orderflow",
    "BTC orderflow (CVD, icebergs, taker, funding)",
    "/api/m2m/internal/orderflow",
);

export const REGIME_X402 = createF58nProduct(
    "get_regime",
    "BTC regime (season, ADX, session, structure zone)",
    "/api/m2m/internal/regime",
);

export const IGNITION_X402 = createF58nProduct(
    "get_ignition",
    "BTC ignition (VID / micro entry / vol spike)",
    "/api/m2m/internal/ignition",
);

export const ENTRY_QUALITY_X402 = createF58nProduct(
    "get_entry_quality",
    "BTC entry-quality flags (FOMO / anti-top / clean)",
    "/api/m2m/internal/entry-quality",
);
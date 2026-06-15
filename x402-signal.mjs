/**
 * F#22 — x402 helpers for MCP get_btc_usdc_signal (CDP facilitator, same as m2m middleware).
 * F#42N — summary v2 + interpretation_contract_v1 on compact MCP responses.
 */
import axios from "axios";
import { verifyPaymentWithFacilitator } from "./x402-facilitator-client.mjs";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;
const BASE_MAINNET = "eip155:8453";

const CDP_FACILITATOR_URL =
    process.env.X402_FACILITATOR_URL ||
    "https://api.cdp.coinbase.com/platform/v2/x402";

/** Mirrors F#21 FORBIDDEN_PAYLOAD_KEYS — summary must never expose these key names. */
const FORBIDDEN_SUMMARY_KEYS = new Set([
    "stop_loss",
    "take_profit",
    "take_profit_price",
    "recommended_action",
    "entry_advice",
    "signal_strength",
]);

export const SIGNAL_PRICE_USDC = parseFloat(
    process.env.MIMO_SIGNAL_X402_PRICE_USDC || "0.01",
);

export const SIGNAL_PAYTO = (
    process.env.MIMO_SIGNAL_X402_PAYTO ||
    process.env.NATT_X402_TREASURY ||
    "0x5a78ACE5DD133316c8aaf7E156FBfc57E1209Cf9"
).toLowerCase();

const SIGNAL_DESCRIPTION =
    "Should I enter BTC now? Real-time cycle state from a live Hyperliquid vault — verified on-chain";
// F#32N — Bazaar/Agentic.Market indexes via paymentPayload.resource at settle
// time: it MUST be the resource URL, not a description.
const SIGNAL_RESOURCE_URL =
    process.env.PUBLIC_MCP_URL || "https://hypernatt.com/mcp/protocol";

function usdcAtomic(priceUsdc) {
    return String(Math.round(priceUsdc * 10 ** USDC_DECIMALS));
}

export function isMcpSignalSummaryV2Enabled() {
    return process.env.MCP_SIGNAL_SUMMARY_V2_ENABLED !== "false";
}

export function collectForbiddenSummaryKeys(obj, prefix = "") {
    const hits = [];
    if (!obj || typeof obj !== "object") {
        return hits;
    }
    if (Array.isArray(obj)) {
        for (const item of obj) {
            hits.push(...collectForbiddenSummaryKeys(item, prefix));
        }
        return hits;
    }
    for (const [key, val] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (FORBIDDEN_SUMMARY_KEYS.has(key)) {
            hits.push(path);
        }
        hits.push(...collectForbiddenSummaryKeys(val, path));
    }
    return hits;
}

export function buildPaymentRequirements() {
    const priceLabel = `$${SIGNAL_PRICE_USDC.toFixed(2)}`;
    return {
        scheme: "exact",
        network: BASE_MAINNET,
        maxAmountRequired: usdcAtomic(SIGNAL_PRICE_USDC),
        amount: usdcAtomic(SIGNAL_PRICE_USDC),
        payTo: SIGNAL_PAYTO,
        maxTimeoutSeconds: 60,
        asset: USDC_ADDRESS,
        extra: { name: "USD Coin", version: "2", decimals: USDC_DECIMALS, assetTransferMethod: "eip3009" },
        resource: SIGNAL_RESOURCE_URL,
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
    return verifyPaymentWithFacilitator(
        paymentPayload,
        paymentPayload?.accepted ?? buildPaymentRequirements(),
    );
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

function buildChainSnapshot(chain) {
    if (!chain || typeof chain !== "object") {
        return null;
    }
    return {
        entry_price: chain.entry_price ?? null,
        size: chain.size ?? null,
        leverage: chain.leverage ?? null,
        unrealized_pnl_pct: chain.unrealized_pnl_pct ?? null,
        unrealized_pnl_usd: chain.unrealized_pnl_usd ?? null,
        liquidation_price: chain.liquidation_price ?? null,
        position_tp_observed: chain.take_profit_price ?? null,
    };
}

function buildCheckpointSnapshot(checkpoint) {
    if (!checkpoint || typeof checkpoint !== "object") {
        return null;
    }
    const last = checkpoint.last_decision;
    return {
        last_action: last?.action ?? null,
        last_confidence: last?.confidence ?? null,
        last_at: last?.timestamp ?? null,
        mfe_pct: checkpoint.mfe_percentage ?? null,
        max_drawdown_pct: checkpoint.max_drawdown_pct ?? null,
    };
}

/** F#42N — machine-readable guardrails for agent signal reads. */
export function buildSignalInterpretationContract() {
    return {
        version: "1",
        purpose_en:
            "Live vault cycle state + observable position metrics for agent workflows. Not trade advice.",
        pnl_authority_en:
            "Open unrealized PnL MUST use chain_snapshot.unrealized_pnl_pct / unrealized_pnl_usd. " +
            "Do NOT compute open PnL from position_accounting.avg_entry_price vs spot.",
        not_for_en: [
            "MM trap / sweep verdict (use get_mm_trap_state).",
            "Historical BTC analogy (use get_similarity_match with confidence_tier).",
            "Raw liquidation clusters (use get_liq_radar).",
            "Order execution or position sizing.",
        ],
        do_not_infer: [
            "Do not treat position_tp_observed as a recommendation to take profit.",
            "Do not treat checkpoint_snapshot.last_confidence as market certainty.",
            "Do not narrate bullish/bearish vault conviction without get_mm_trap_state when trap may be active.",
            "Do not align similarity outcome_4h_pct with vault direction without explicit signal direction.",
            "If a field is missing, call full_payload:true — do not invent values.",
        ],
        required_agent_behavior: [
            "State chain_snapshot PnL when discussing open position performance.",
            "Before challenging or defending vault HOLD, cite get_mm_trap_state.chart_verdicts.hunt.",
            "Quote interpretation_contract_v1.do_not_infer (or summarize all bullets) on first signal read per session.",
        ],
        cross_reads_recommended: [
            "get_mm_trap_state",
            "get_mm_hunt_score",
            "get_liq_radar",
        ],
    };
}

export function buildSignalAgentReading(payload, chainSnapshot) {
    const cycle = payload?.cycle || {};
    const direction = cycle.direction ?? "unknown";
    const pnl = chainSnapshot?.unrealized_pnl_pct;
    const pnlPart =
        pnl != null
            ? `chain unrealized PnL ${pnl}% (ROE on margin).`
            : "no active chain snapshot.";
    return (
        `Vault cycle ${direction}; ${pnlPart} ` +
        "Cross-read get_mm_trap_state before challenging HOLD. " +
        "Do not infer open PnL from avg_entry_price."
    );
}

/** Legacy compact summary (F#21 / pre-F#42N). */
export function summarizeCyclePayloadV1(payload) {
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
            scope: track.scope,
            verify_yourself: "https://hypernatt.com/stats",
        },
        proof_snapshot_hash: proof.snapshot_hash,
        verification_url: track.url || "https://hypernatt.com/stats",
        disclaimer:
            payload?.disclaimer ||
            "Live verifiable Mimo cycle state only. Not a trade recommendation.",
    };
}

/** F#42N — compact summary with chain/checkpoint snapshots + interpretation contract. */
export function summarizeCyclePayloadV2(payload) {
    const base = summarizeCyclePayloadV1(payload);
    const cycle = payload?.cycle || {};
    const hasActive = Boolean(payload?.has_active);
    const chainSnapshot = hasActive ? buildChainSnapshot(cycle.chain) : null;
    const checkpointSnapshot = hasActive
        ? buildCheckpointSnapshot(cycle.checkpoint)
        : null;
    const positionAccounting = hasActive
        ? {
              avg_entry_price: cycle.avg_entry_price ?? null,
              initial_entry: cycle.initial_entry ?? null,
              started_at: cycle.started_at ?? null,
          }
        : null;

    return {
        ...base,
        chain_snapshot: chainSnapshot,
        checkpoint_snapshot: checkpointSnapshot,
        position_accounting: positionAccounting,
        interpretation_contract_v1: buildSignalInterpretationContract(),
        agent_reading_en: buildSignalAgentReading(payload, chainSnapshot),
    };
}

/** Compact summary for agents — no forbidden TP/SL advice keys (F#21 product contract). */
export function summarizeCyclePayload(payload) {
    if (isMcpSignalSummaryV2Enabled()) {
        return summarizeCyclePayloadV2(payload);
    }
    return summarizeCyclePayloadV1(payload);
}

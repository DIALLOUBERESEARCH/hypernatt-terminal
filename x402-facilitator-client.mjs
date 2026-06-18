/**
 * CDP x402 facilitator /verify with JWT auth (F#23 fix — prod 401).
 * Scope: MCP terminal paid tools only — not HL vault / trading-service.
 */
import axios from "axios";
import { createAuthHeader, createCorrelationHeader } from "@coinbase/x402";

const DEFAULT_FACILITATOR =
    process.env.X402_FACILITATOR_URL ||
    "https://api.cdp.coinbase.com/platform/v2/x402";
const VERIFY_PATH = "/platform/v2/x402/verify";
const SETTLE_PATH = "/platform/v2/x402/settle";
const REQUEST_HOST = "api.cdp.coinbase.com";

/**
 * Human-readable USD price label. Avoids "$0.00" for sub-cent prices
 * (e.g. 0.001 USDC). Display only — the on-chain charge uses usdcAtomic()
 * and is unchanged.
 *   >= 0.01 -> 2 decimals ("0.01", "1.00")
 *   <  0.01 -> up to 6 decimals, trailing zeros stripped ("0.001")
 */
export function formatUsdLabel(price) {
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) return "0.00";
    if (p >= 0.01) return p.toFixed(2);
    return p.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function verifyUrl() {
    return `${String(DEFAULT_FACILITATOR).replace(/\/$/, "")}/verify`;
}

function settleUrl() {
    return `${String(DEFAULT_FACILITATOR).replace(/\/$/, "")}/settle`;
}

async function buildAuthHeaders(requestPath) {
    const headers = {
        "Content-Type": "application/json",
        "Correlation-Context": createCorrelationHeader(),
    };
    const apiKeyId = process.env.CDP_API_KEY_ID;
    const apiKeySecret = process.env.CDP_API_KEY_SECRET;
    if (apiKeyId && apiKeySecret) {
        headers.Authorization = await createAuthHeader(
            apiKeyId,
            apiKeySecret,
            "POST",
            REQUEST_HOST,
            requestPath,
        );
    }
    return headers;
}

async function buildVerifyHeaders() {
    return buildAuthHeaders(VERIFY_PATH);
}

function normalizePaymentRequirements(req) {
    const amount = req?.amount ?? req?.maxAmountRequired ?? "0";
    const payTo = String(req.payTo || "").toLowerCase();
    const asset = String(req.asset || "").toLowerCase();
    return {
        scheme: req.scheme,
        network: req.network,
        asset,
        amount: String(amount),
        payTo,
        maxTimeoutSeconds: req.maxTimeoutSeconds ?? 60,
        extra: req.extra ?? {
            name: "USD Coin",
            version: "2",
            assetTransferMethod: "eip3009",
        },
        ...(req.resource ? { resource: req.resource } : {}),
        ...(req.description ? { description: req.description } : {}),
        ...(req.mimeType ? { mimeType: req.mimeType } : {}),
    };
}

export async function verifyPaymentWithFacilitator(
    paymentPayload,
    paymentRequirements,
) {
    const sim = paymentPayload;
    if (
        sim &&
        typeof sim.receipt === "string" &&
        sim.receipt.startsWith("X402-VRP-")
    ) {
        return { isValid: true };
    }

    if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
        return {
            isValid: false,
            error: "CDP_API_KEY_ID/SECRET missing on mcp-server",
        };
    }

    try {
        const response = await axios.post(
            verifyUrl(),
            {
                x402Version: 2,
                paymentPayload,
                paymentRequirements: normalizePaymentRequirements(
                    paymentRequirements,
                ),
            },
            { headers: await buildVerifyHeaders(), timeout: 10000 },
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
        const response =
            err && typeof err === "object" && "response" in err
                ? err.response
                : null;
        const status = response?.status;
        const body =
            response?.data != null
                ? JSON.stringify(response.data).slice(0, 500)
                : "";
        const suffix = status ? ` HTTP ${status}${body ? `: ${body}` : ""}` : "";
        return { isValid: false, error: `${message}${suffix}` };
    }
}

/**
 * F#32N — settle a verified payment so the USDC actually moves to the
 * treasury. Before this, the MCP path verified but NEVER settled: a paying
 * agent got the data and kept its money.
 */
export async function settlePaymentWithFacilitator(
    paymentPayload,
    paymentRequirements,
) {
    const sim = paymentPayload;
    if (
        sim &&
        typeof sim.receipt === "string" &&
        sim.receipt.startsWith("X402-VRP-")
    ) {
        return { success: true, simulated: true };
    }

    if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
        return { success: false, error: "CDP_API_KEY_ID/SECRET missing" };
    }

    try {
        const response = await axios.post(
            settleUrl(),
            {
                x402Version: 2,
                paymentPayload,
                paymentRequirements: normalizePaymentRequirements(
                    paymentRequirements,
                ),
            },
            { headers: await buildAuthHeaders(SETTLE_PATH), timeout: 15000 },
        );
        return {
            success: response.data?.success === true,
            txHash: response.data?.transaction,
            error: response.data?.errorReason,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
    }
}

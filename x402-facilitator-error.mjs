/**
 * Mirror of lib/x402-facilitator-error.ts for mcp-server (plain ESM).
 */

function asRecord(v) {
    if (v && typeof v === "object" && !Array.isArray(v)) return v;
    return null;
}

function strField(obj, key) {
    if (!obj) return undefined;
    const v = obj[key];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export function buyerHintFromCdpText(text) {
    const t = String(text || "").toLowerCase();
    if (t.includes("requires 'accepted'") || t.includes('requires "accepted"')) {
        return (
            "Payload x402 v2 incomplet: champ `accepted` manquant. " +
            "Le buyer doit renvoyer les requirements acceptees (voir hypernatt.com/llms.txt)."
        );
    }
    if (t.includes("invalid signature") || t.includes("signature")) {
        return "Signature ou autorisation invalide cote buyer (EIP-712 / tx).";
    }
    if (t.includes("insufficient") || t.includes("balance")) {
        return "Fonds USDC insuffisants sur le wallet buyer.";
    }
    if (t.includes("expired") || t.includes("timeout") || t.includes("maxtimeout")) {
        return "Paiement expire avant verify/settle — buyer doit renvoyer un payload frais.";
    }
    if (
        t.includes("invalid_exact_svm") ||
        t.includes("preflight_validation") ||
        t.includes("simulation_failed")
    ) {
        return (
            "Solana x402 exact: construire une tx SPL TransferChecked avec " +
            "feePayer = extra.feePayer du 402. Un client EVM/Base ne peut pas payer ce rail. " +
            "Utiliser @x402/svm (docs/x402-pay.md)."
        );
    }
    if (t.includes("invalid_network")) {
        return "Reseau x402 invalide — un seul rail par payload; Solana = CAIP-2 du 402, pas un signer EVM.";
    }
    if (t.includes("paymentpayload is invalid")) {
        return "Payload x402 mal forme — verifier version 2 + champs obligatoires CDP.";
    }
    return undefined;
}

function buildSummary(parts) {
    const core =
        parts.cdpErrorMessage ||
        parts.invalidReason ||
        parts.fallback ||
        "Payment verification failed";
    const meta = [];
    if (parts.cdpErrorType) meta.push(`type=${parts.cdpErrorType}`);
    if (parts.httpStatus) meta.push(`HTTP ${parts.httpStatus}`);
    if (parts.correlationId) meta.push(`corr=${parts.correlationId}`);
    return meta.length ? `${core} (${meta.join(", ")})` : core;
}

export function parseCdpFacilitatorError(err) {
    const response = err && typeof err === "object" ? err.response : null;
    const httpStatus =
        typeof response?.status === "number" ? response.status : undefined;
    const data = asRecord(response?.data);
    const cdpErrorMessage = strField(data, "errorMessage");
    const cdpErrorType = strField(data, "errorType");
    const invalidReason = strField(data, "invalidReason");
    const correlationId = strField(data, "correlationId");

    if (httpStatus !== undefined || data) {
        const summary = buildSummary({
            httpStatus,
            cdpErrorMessage,
            invalidReason,
            cdpErrorType,
            correlationId,
            fallback:
                (err && err.message) ||
                (err instanceof Error ? err.message : String(err)),
        });
        return {
            summary,
            httpStatus,
            cdpErrorType,
            cdpErrorMessage,
            invalidReason,
            correlationId,
            buyerHint: buyerHintFromCdpText(summary),
            isReachabilityError:
                httpStatus === undefined ||
                httpStatus >= 500 ||
                (httpStatus === 0 && !cdpErrorMessage && !invalidReason),
        };
    }

    const message = err instanceof Error ? err.message : String(err);
    const unreachable =
        /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|timeout|network error/i.test(message);
    return {
        summary: unreachable
            ? `CDP facilitator unreachable: ${message}`
            : message,
        buyerHint: buyerHintFromCdpText(message),
        isReachabilityError: unreachable,
    };
}

export function formatFacilitatorErrorForStorage(parsed, maxLen = 500) {
    return String(parsed.summary || "").slice(0, maxLen);
}

/**
 * F#204 / F#221 — JS twin of lib/x402-svm-hydrate.ts. Same law. Keep in lockstep.
 */

export class PayToMismatchError extends Error {
    constructor(message = "x402 SVM payTo mismatch vs server") {
        super(message);
        this.name = "PayToMismatchError";
        this.field = "payTo";
    }
}

export class AssetMismatchError extends Error {
    constructor(message = "x402 SVM asset mismatch vs server") {
        super(message);
        this.name = "AssetMismatchError";
        this.field = "asset";
    }
}

export class NetworkMismatchError extends Error {
    constructor(message = "x402 SVM network mismatch vs server") {
        super(message);
        this.name = "NetworkMismatchError";
        this.field = "network";
    }
}

export class FeePayerMismatchError extends Error {
    constructor(message = "x402 SVM feePayer mismatch vs server") {
        super(message);
        this.name = "FeePayerMismatchError";
        this.field = "feePayer";
    }
}

export class AmountMismatchError extends Error {
    constructor(message = "x402 SVM amount mismatch vs server") {
        super(message);
        this.name = "AmountMismatchError";
        this.field = "amount";
    }
}

function isSvmNetwork(network) {
    return (
        typeof network === "string" &&
        network.trim().toLowerCase().startsWith("solana")
    );
}

function isEmpty(value) {
    return value == null || (typeof value === "string" && value.trim() === "");
}

function acceptedNetwork(payload) {
    const accepted = payload.accepted;
    if (accepted && typeof accepted === "object") {
        return accepted.network;
    }
    return undefined;
}

const EVM_FROM_RE = /^0x[0-9a-fA-F]{40}$/;
const SVM_TX_MIN_LEN = 32;

function nestedRecord(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value;
    }
    return null;
}

function looksLikeEvmExact(payload) {
    const nested = nestedRecord(payload.payload);
    const auth = nested ? nestedRecord(nested.authorization) : null;
    const from = auth?.from;
    return typeof from === "string" && EVM_FROM_RE.test(from);
}

function svmTxBlob(payload) {
    const nested = nestedRecord(payload.payload);
    const raw = nested?.transaction ?? payload.transaction;
    if (typeof raw !== "string") return null;
    const t = raw.trim();
    return t.length >= SVM_TX_MIN_LEN ? t : null;
}

/** F#221 — SVM exact blob or solana network. EVM EIP-3009 wins if both present. */
export function looksLikeSvmPayment(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return false;
    }
    if (looksLikeEvmExact(payload)) return false;
    if (isSvmNetwork(acceptedNetwork(payload) ?? payload.network)) return true;
    return svmTxBlob(payload) != null;
}

function cloneExtra(current, serverExtra) {
    const server =
        serverExtra && typeof serverExtra === "object" ? { ...serverExtra } : {};
    if (!current || typeof current !== "object") {
        return server;
    }
    const extra = { ...current };
    if (isEmpty(extra.feePayer) && !isEmpty(server.feePayer)) {
        extra.feePayer = server.feePayer;
    }
    return extra;
}

export function hydrateSvmPaymentPayload(payload, serverReq) {
    if (!payload || typeof payload !== "object") return payload;
    const p = payload;
    if (looksLikeEvmExact(p)) return payload;
    const serverNet = serverReq?.network;
    if (!isSvmNetwork(serverNet)) return payload;
    if (!looksLikeSvmPayment(p)) return payload;

    const acceptedSrc =
        p.accepted && typeof p.accepted === "object" ? p.accepted : {};
    const accepted = { ...acceptedSrc };

    if (
        !isEmpty(accepted.payTo) &&
        String(accepted.payTo) !== String(serverReq.payTo)
    ) {
        throw new PayToMismatchError("x402 SVM payTo mismatch vs server");
    }
    if (
        !isEmpty(accepted.asset) &&
        String(accepted.asset) !== String(serverReq.asset)
    ) {
        throw new AssetMismatchError("x402 SVM asset mismatch vs server");
    }

    // Fable 5 Adjustment 1 — Network: map v1 aliases ("solana", "solana-mainnet") -> CAIP-2,
    // handle dual-rail EVM echo, and reject divergent networks.
    const rawNet = accepted.network;
    if (isEmpty(rawNet)) {
        accepted.network = serverReq.network;
    } else {
        const netStr = String(rawNet).trim();
        if (netStr === "solana" || netStr === "solana-mainnet") {
            accepted.network = serverReq.network;
        } else if (netStr === String(serverReq.network)) {
            accepted.network = serverReq.network;
        } else if (netStr.startsWith("eip155:") && looksLikeSvmPayment(p)) {
            accepted.network = serverReq.network;
        } else {
            throw new NetworkMismatchError(`x402 SVM network mismatch: got "${netStr}", expected "${serverReq.network}"`);
        }
    }

    // Fable 5 Adjustment 1 — FeePayer: fill if absent, reject if client provided wrong feePayer
    const serverFeePayer = serverReq.extra?.feePayer;
    const acceptedExtra = (accepted.extra && typeof accepted.extra === "object" ? accepted.extra : {});
    if (!isEmpty(acceptedExtra.feePayer) && !isEmpty(serverFeePayer) && String(acceptedExtra.feePayer) !== String(serverFeePayer)) {
        throw new FeePayerMismatchError(`x402 SVM feePayer mismatch: got "${acceptedExtra.feePayer}", expected "${serverFeePayer}"`);
    }
    accepted.extra = cloneExtra(accepted.extra, serverReq.extra);

    const fill = (field, value) => {
        if (isEmpty(accepted[field]) && !isEmpty(value)) {
            accepted[field] = value;
        }
    };

    fill("scheme", serverReq.scheme ?? "exact");
    fill("asset", serverReq.asset);
    fill("payTo", serverReq.payTo);
    fill("maxTimeoutSeconds", serverReq.maxTimeoutSeconds ?? 60);

    // Fable 5 Adjustment 1 — Amount: do not unconditionally overwrite client amount
    const serverAmt = serverReq.amount ?? serverReq.maxAmountRequired;
    if (isEmpty(accepted.amount)) {
        if (!isEmpty(serverAmt)) {
            accepted.amount = String(serverAmt);
        }
    } else {
        const clientAmtStr = String(accepted.amount).trim();
        const serverAmtStr = String(serverAmt).trim();
        if (clientAmtStr === serverAmtStr) {
            accepted.amount = serverAmtStr;
        } else if (clientAmtStr === "0.001" && serverAmtStr === "1000") {
            // F#221 backward compatibility: client sent human-readable decimal "$0.001"
            // where server requires 1000 atomic units. Exact match on decimal string only.
            accepted.amount = "1000";
        } else {
            throw new AmountMismatchError(
                `x402 SVM amount mismatch: client sent "${clientAmtStr}", server requires atomic units "${serverAmtStr}"`,
            );
        }
    }

    let resource = p.resource;
    if (typeof resource === "string" && resource.trim()) {
        resource = { url: resource, mimeType: "application/json" };
    }

    return {
        ...p,
        accepted,
        ...(resource !== undefined ? { resource } : {}),
    };
}

export function isSvmCompatEnabled() {
    return (
        String(process.env.MIMO_SIGNAL_X402_SVM_COMPAT_ENABLED || "")
            .trim()
            .toLowerCase() === "true"
    );
}

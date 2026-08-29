/**
 * F#204 — JS twin of lib/x402-svm-hydrate.ts. Same law. Keep in lockstep.
 */

export class PayToMismatchError extends Error {
    constructor(message = "x402 SVM payTo/asset mismatch vs server") {
        super(message);
        this.name = "PayToMismatchError";
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
    const payloadNet = acceptedNetwork(p) ?? p.network;
    const serverNet = serverReq?.network;
    if (!isSvmNetwork(payloadNet) || !isSvmNetwork(serverNet)) {
        return payload;
    }

    const acceptedSrc =
        p.accepted && typeof p.accepted === "object" ? p.accepted : {};
    const accepted = { ...acceptedSrc };

    if (
        !isEmpty(accepted.payTo) &&
        String(accepted.payTo) !== String(serverReq.payTo)
    ) {
        throw new PayToMismatchError();
    }
    if (
        !isEmpty(accepted.asset) &&
        String(accepted.asset) !== String(serverReq.asset)
    ) {
        throw new PayToMismatchError();
    }

    const fill = (field, value) => {
        if (isEmpty(accepted[field]) && !isEmpty(value)) {
            accepted[field] = value;
        }
    };

    fill("scheme", serverReq.scheme ?? "exact");
    fill("network", serverReq.network);
    fill("asset", serverReq.asset);
    fill("amount", serverReq.amount ?? serverReq.maxAmountRequired);
    fill("payTo", serverReq.payTo);
    fill("maxTimeoutSeconds", serverReq.maxTimeoutSeconds ?? 60);
    accepted.extra = cloneExtra(accepted.extra, serverReq.extra);

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

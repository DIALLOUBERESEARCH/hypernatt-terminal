/**
 * F#204 — JS twin of lib/x402-svm-ata.ts. Same law. Keep in lockstep.
 */

const DEFAULT_RPC = "https://api.mainnet-beta.solana.com";
const DEFAULT_PAYTO = "2hAXt3sb2GZrtXx4ae4Ywc7enqrE191nktyL5k2nWSfg";
const DEFAULT_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

let state = "unknown";
let expiresAt = 0;
let inflight = null;

function isSvmCompatEnabled() {
    return (
        String(process.env.MIMO_SIGNAL_X402_SVM_COMPAT_ENABLED || "")
            .trim()
            .toLowerCase() === "true"
    );
}

function isSolanaEnabled() {
    return (
        String(process.env.MIMO_SIGNAL_X402_SOLANA_ENABLED || "")
            .trim()
            .toLowerCase() === "true"
    );
}

export function svmAtaCacheSec() {
    const n = Number(process.env.X402_SVM_ATA_CACHE_SEC ?? 60);
    if (!Number.isFinite(n)) return 60;
    return Math.max(10, Math.min(300, n));
}

export function solanaAtaAllowsAccept() {
    return state !== "empty";
}

export function shouldAppendSolanaAccept() {
    if (!isSolanaEnabled()) return false;
    if (!isSvmCompatEnabled()) return true;
    return solanaAtaAllowsAccept();
}

export function getSolanaAtaStateForTest() {
    return state;
}

export function setSolanaAtaStateForTest(next, ttlMs = 60_000) {
    state = next;
    expiresAt = Date.now() + ttlMs;
}

export function resetSolanaAtaCache() {
    state = "unknown";
    expiresAt = 0;
    inflight = null;
}

function rpcUrl() {
    const raw = String(process.env.SOLANA_RPC_URL || "").trim();
    return raw || DEFAULT_RPC;
}

export function maybeKickSolanaAtaRefresh() {
    if (!isSvmCompatEnabled() || !isSolanaEnabled()) return;
    const now = Date.now();
    if (state !== "unknown" && now < expiresAt) return;
    if (inflight) return;
    inflight = refreshSolanaAta().finally(() => {
        inflight = null;
    });
}

export async function refreshSolanaAta(opts = {}) {
    const now = opts.now ?? Date.now();
    if (state !== "unknown" && now < expiresAt && !opts.fetchImpl) {
        return state;
    }

    const payTo =
        opts.payTo ||
        process.env.MIMO_SIGNAL_X402_SOLANA_PAYTO ||
        DEFAULT_PAYTO;
    const mint =
        opts.mint ||
        process.env.MIMO_SIGNAL_X402_SOLANA_USDC_MINT ||
        DEFAULT_MINT;
    const url = opts.rpc || rpcUrl();
    const fetchImpl = opts.fetchImpl ?? fetch;

    try {
        const response = await fetchImpl(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "getTokenAccountsByOwner",
                params: [
                    payTo,
                    { mint },
                    { encoding: "jsonParsed", commitment: "confirmed" },
                ],
            }),
        });
        if (!response.ok) {
            return state;
        }
        const body = await response.json();
        if (body.error) {
            return state;
        }
        const value = body.result?.value;
        if (!Array.isArray(value)) {
            return state;
        }
        // F#204 audit: Tests on-chain existence of the ATA account (value.length === 0 means account does not exist).
        // NEVER tests tokenAmount.amount === "0". A swept treasury with 0 USDC balance retains its initialized ATA
        // on-chain (rent-exempt) and evaluates to "ok", keeping the Solana rail active in accepts[].
        const next = value.length === 0 ? "empty" : "ok";
        if (next === "empty") {
            console.error(
                "[F#204] Solana USDC ATA not found on payTo — omitting Solana from accepts[] until owner creates/initializes ATA",
            );
        }
        state = next;
        expiresAt = now + svmAtaCacheSec() * 1000;
        return state;
    } catch {
        return state;
    }
}

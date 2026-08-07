/**
 * F#67 — x402 multi-rail (Base + Solana). Shared, pure helpers.
 *
 * Base (EVM) is the existing rail and is left STRICTLY unchanged. Solana (SVM) is
 * an ADDITIVE second entry in the 402 `accepts[]`, gated by a flag and OFF by
 * default until the on-chain smoke passes. The x402 protocol natively supports
 * multiple `accepts` entries; the buyer picks a rail and the chosen requirement
 * is echoed back in `paymentPayload.accepted`, so verify/settle route per network.
 *
 * Solana mainnet x402 values CONFIRMED from the CDP facilitator GET /supported
 * (x402Version 2, scheme "exact"):
 *   - network  = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"
 *   - extra    = { feePayer: "D6ZhtNQ5nT9ZnTHUbqXZsTx5MH2rPFiBBggX4hY1WePM" }  (facilitator sponsors gas)
 *   - asset    = USDC SPL mint mainnet "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
 * All four are env-overridable so a rotation needs no code change.
 *
 * CRITICAL (money): Solana addresses are base58 and CASE-SENSITIVE. Unlike EVM
 * hex, they must NEVER be lowercased (see normalizePaymentRequirements branch).
 */

const SOLANA_NETWORK =
    process.env.MIMO_SIGNAL_X402_SOLANA_NETWORK ||
    "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

const SOLANA_USDC_MINT =
    process.env.MIMO_SIGNAL_X402_SOLANA_USDC_MINT ||
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const SOLANA_FEE_PAYER =
    process.env.MIMO_SIGNAL_X402_SOLANA_FEE_PAYER ||
    "D6ZhtNQ5nT9ZnTHUbqXZsTx5MH2rPFiBBggX4hY1WePM";

// Owner treasury for Solana payments (base58, case preserved). Default per owner.
const SOLANA_PAYTO =
    process.env.MIMO_SIGNAL_X402_SOLANA_PAYTO ||
    "2hAXt3sb2GZrtXx4ae4Ywc7enqrE191nktyL5k2nWSfg";

/** True only when the Solana rail is explicitly enabled (default OFF). */
export function isSolanaX402Enabled() {
    return String(process.env.MIMO_SIGNAL_X402_SOLANA_ENABLED || "")
        .trim()
        .toLowerCase() === "true";
}

/** A network id is Solana/SVM when it starts with "solana" (CAIP-2 "solana:..."). */
export function isSolanaNetwork(network) {
    return (
        typeof network === "string" &&
        network.trim().toLowerCase().startsWith("solana")
    );
}

export function solanaPayTo() {
    return SOLANA_PAYTO;
}

/**
 * Derive the Solana "exact" requirement from an existing Base requirement so the
 * dollar amount is GUARANTEED identical (same atomic units). Only the rail-specific
 * fields differ (network, asset mint, payTo, feePayer extra). Base fields like
 * resource/maxTimeoutSeconds/mimeType are mirrored; description swaps "Base"->"Solana".
 */
export function buildSolanaRequirementFromBase(base) {
    const atomic = String(base?.maxAmountRequired ?? base?.amount ?? "0");
    const description =
        typeof base?.description === "string"
            ? base.description.replace(/on Base\b/gi, "on Solana")
            : base?.description;
    return {
        scheme: "exact",
        network: SOLANA_NETWORK,
        maxAmountRequired: atomic,
        amount: atomic,
        payTo: SOLANA_PAYTO, // base58 - case preserved (NEVER lowercase)
        maxTimeoutSeconds: base?.maxTimeoutSeconds ?? 60,
        asset: SOLANA_USDC_MINT, // base58 mint - case preserved
        extra: { feePayer: SOLANA_FEE_PAYER },
        ...(base?.resource ? { resource: base.resource } : {}),
        ...(description ? { description } : {}),
        mimeType: base?.mimeType ?? "application/json",
    };
}

/**
 * Compose the 402 `accepts[]`: Base ALWAYS first (unchanged), Solana appended
 * only when the flag is on. Pure: given the same base + env, same output.
 */
export function buildAccepts(baseRequirement) {
    const accepts = [baseRequirement];
    if (isSolanaX402Enabled()) {
        accepts.push(buildSolanaRequirementFromBase(baseRequirement));
    }
    return accepts;
}

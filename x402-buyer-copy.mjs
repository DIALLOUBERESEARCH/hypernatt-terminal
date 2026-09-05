/**
 * Mirror of lib/x402-buyer-copy.ts for mcp-server (plain ESM).
 */
export const X402_SVM_CLIENT_HINT_EN =
    "Solana x402 is SVM exact, not an EVM signature. No @x402/svm -> pay accepts[0] Base. " +
    "SVM tx expires in ~90s (blockhash); sign immediately. " +
    "feePayer MUST equal extra.feePayer from this 402; amount MUST equal accepts[].amount.";

export function x402PaymentRequiredError(priceUsdLabel) {
    return (
        `X-PAYMENT header required. Pay $${priceUsdLabel} USDC exact via x402 on ` +
        `Base (eip155:8453, EIP-3009) OR Solana (SVM exact). ${X402_SVM_CLIENT_HINT_EN}`
    );
}

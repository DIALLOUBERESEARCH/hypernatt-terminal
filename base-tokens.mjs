/** Mirror of lib/base-tokens.ts for MCP tool handlers. */
export const BASE_CHAIN_ID = 8453;
export const TERMINAL_PAIR = "BTC/USDC";
export const TERMINAL_SWAP_ERROR =
    "This terminal only supports BTC/USDC swaps.";

export const ALLOWED_BASE_SWAP_TOKENS = [
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf",
    "0x0555e30da8f98308edb960aa94c0db33955df0",
];

const ALLOWED_SET = new Set(ALLOWED_BASE_SWAP_TOKENS);

function normalizeTokenAddress(addr) {
    return String(addr || "").trim().toLowerCase();
}

function isAllowedBaseSwapToken(token) {
    return ALLOWED_SET.has(normalizeTokenAddress(token));
}

function isBaseChainId(chain) {
    const n = Number(chain);
    return Number.isFinite(n) && n === BASE_CHAIN_ID;
}

export function validateTerminalSwap(params) {
    if (!isBaseChainId(params.fromChain) || !isBaseChainId(params.toChain)) {
        return TERMINAL_SWAP_ERROR;
    }
    if (
        !isAllowedBaseSwapToken(params.fromToken) ||
        !isAllowedBaseSwapToken(params.toToken)
    ) {
        return TERMINAL_SWAP_ERROR;
    }
    return null;
}

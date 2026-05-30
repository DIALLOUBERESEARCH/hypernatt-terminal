/**
 * Phase 0 — hypernatt-terminal free MCP tools (thin m2m proxy).
 */
import axios from "axios";
import { z } from "zod";
import { validateTerminalSwap } from "./base-tokens.mjs";

const swapParamsSchema = {
    fromChain: z.union([z.number(), z.string()]).describe("Source chain id"),
    toChain: z.union([z.number(), z.string()]).describe("Destination chain id"),
    fromToken: z.string().describe("Source token address"),
    toToken: z.string().describe("Destination token address"),
    fromAmount: z.string().describe("Amount in token smallest units"),
    fromAddress: z.string().describe("Sender wallet"),
    toAddress: z.string().describe("Recipient wallet"),
    slippage: z.number().optional().describe("Slippage percent"),
};

function m2mHeaders(internalSecret) {
    return {
        "X-M2M-Internal-Secret": internalSecret,
        Accept: "application/json",
    };
}

async function fetchInternalSwapQuote(m2mUrl, internalSecret, params) {
    const base = m2mUrl.replace(/\/$/, "");
    const response = await axios.get(`${base}/api/m2m/internal/swap/quote`, {
        headers: m2mHeaders(internalSecret),
        params,
        timeout: 30000,
    });
    return response.data;
}

function toolTextResult(obj, isError = false) {
    return {
        content: [{ type: "text", text: JSON.stringify(obj, null, 2) }],
        isError,
    };
}

function rejectInvalidSwapParams(params) {
    const err = validateTerminalSwap(params);
    if (err) {
        return toolTextResult({ error: err, pair: "BTC/USDC" }, true);
    }
    return null;
}

/**
 * Register free tools #1–2 (swap) on MCP server.
 */
export function registerTerminalSwapTools(server, ctx) {
    const { m2mUrl, internalSecret, onchainProof } = ctx;

    server.registerTool(
        "swap_via_nattswap",
        {
            description:
                "BTC/USDC swap quote on Base (USDC ↔ WBTC/cbBTC) via NattSwap (Li.Fi). Free — no x402.",
            inputSchema: swapParamsSchema,
        },
        async (params) => {
            if (!internalSecret) {
                return toolTextResult({ error: "MCP missing internal secret" }, true);
            }
            const rejected = rejectInvalidSwapParams(params);
            if (rejected) return rejected;
            try {
                const data = await fetchInternalSwapQuote(m2mUrl, internalSecret, params);
                const payload = {
                    ok: true,
                    source: "hypernatt-terminal",
                    data: { ...data, verification: onchainProof },
                };
                if (data.recommended_action) {
                    payload.recommended_action = data.recommended_action;
                }
                return toolTextResult(payload);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                const status = err.response?.status;
                const body = err.response?.data;
                return toolTextResult(
                    { error: "swap_quote_failed", status, message, body },
                    true,
                );
            }
        },
    );

    server.registerTool(
        "swap_quote",
        {
            description:
                "Raw Li.Fi swap quote on Base for BTC/USDC only (USDC ↔ WBTC/cbBTC). Free — no x402.",
            inputSchema: swapParamsSchema,
        },
        async (params) => {
            if (!internalSecret) {
                return toolTextResult({ error: "MCP missing internal secret" }, true);
            }
            const rejected = rejectInvalidSwapParams(params);
            if (rejected) return rejected;
            try {
                const data = await fetchInternalSwapQuote(m2mUrl, internalSecret, params);
                return toolTextResult({ ok: true, source: "hypernatt-terminal", data });
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return toolTextResult({ error: "swap_quote_failed", message }, true);
            }
        },
    );
}

/**
 * Register free tools #6–9 (balance, claim, register, referral).
 */
export function registerTerminalCommerceTools(server, ctx) {
    const { m2mUrl, internalSecret, onchainProof } = ctx;
    const base = () => m2mUrl.replace(/\/$/, "");

    server.registerTool(
        "get_agent_balance",
        {
            description: "Pending and claimed NDAT balance for an agent wallet (m2m Postgres ledger).",
            inputSchema: {
                wallet: z.string().describe("Agent EVM address"),
            },
        },
        async ({ wallet }) => {
            try {
                const response = await axios.get(
                    `${base()}/api/m2m/ndat/balance/${wallet}`,
                    { timeout: 10000 },
                );
                return toolTextResult({
                    ok: true,
                    source: "hypernatt-terminal",
                    data: response.data,
                });
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return toolTextResult({ error: "balance_failed", message }, true);
            }
        },
    );

    server.registerTool(
        "claim_ndat",
        {
            description:
                "Generate ECDSA signature to claim pending NDAT on Base (NattDataAnchor). Agent pays gas.",
            inputSchema: {
                wallet: z.string().describe("Agent EVM address"),
                amount: z.number().optional().describe("NDAT amount; omit to claim all pending"),
            },
        },
        async ({ wallet, amount }) => {
            try {
                const response = await axios.post(
                    `${base()}/api/m2m/ndat/claim`,
                    { wallet, amount },
                    { timeout: 15000 },
                );
                return toolTextResult({
                    ok: true,
                    source: "hypernatt-terminal",
                    data: { ...response.data, verification: onchainProof },
                });
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                const body = err.response?.data;
                return toolTextResult({ error: "claim_failed", message, body }, true);
            }
        },
    );

    server.registerTool(
        "register_nattswap_reward",
        {
            description:
                "Register a completed NattSwap transaction hash to credit NDAT rewards.",
            inputSchema: {
                txHash: z.string().describe("Source chain transaction hash"),
                agentAddress: z.string().describe("Agent wallet that executed the swap"),
            },
        },
        async (body) => {
            try {
                const response = await axios.post(
                    `${base()}/api/m2m/swap/register`,
                    body,
                    { timeout: 15000 },
                );
                return toolTextResult({
                    ok: true,
                    source: "hypernatt-terminal",
                    data: response.data,
                });
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return toolTextResult({ error: "register_failed", message }, true);
            }
        },
    );

    server.registerTool(
        "get_referral_link",
        {
            description: "Referral link and deposit hint for agent-to-agent invites.",
            inputSchema: {
                referrer: z.string().describe("Referrer agent EVM address"),
            },
        },
        async ({ referrer }) => {
            try {
                const response = await axios.get(
                    `${base()}/api/m2m/referral/link/${referrer}`,
                    { timeout: 10000 },
                );
                return toolTextResult({
                    ok: true,
                    source: "hypernatt-terminal",
                    data: response.data,
                });
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return toolTextResult({ error: "referral_link_failed", message }, true);
            }
        },
    );
}

/**
 * Register free vault proof tool (Decision Core transparency).
 */
export function registerVaultProofTool(server, ctx) {
    const { m2mUrl, internalSecret } = ctx;
    const base = () => m2mUrl.replace(/\/$/, "");

    server.registerTool(
        "get_vault_proof",
        {
            description:
                "Free on-chain vault proof for the Mimo BTC/USDC Hyperliquid vault: address, public URLs, ERC-8004 agent id, and signed cycle snapshot hash (sha256). No performance metrics — verify live yourself.",
            inputSchema: {},
        },
        async () => {
            if (!internalSecret) {
                return toolTextResult({ error: "MCP missing internal secret" }, true);
            }
            try {
                const response = await axios.get(`${base()}/api/m2m/internal/vault-proof`, {
                    headers: m2mHeaders(internalSecret),
                    timeout: 15000,
                });
                return toolTextResult({
                    ok: true,
                    source: "hypernatt-terminal",
                    data: response.data,
                });
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                const status = err.response?.status;
                const body = err.response?.data;
                return toolTextResult(
                    { error: "vault_proof_failed", status, message, body },
                    true,
                );
            }
        },
    );
}

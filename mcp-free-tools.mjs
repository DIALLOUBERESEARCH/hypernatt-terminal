/**
 * Phase 0 — hypernatt-terminal free MCP tools (thin m2m proxy).
 */
import axios from "axios";
import { z } from "zod";
import { toolDescriptionFromCard } from "./server-card-tools.mjs";
import { validateTerminalSwap, terminalSwapPolicyMode } from "./base-tokens.mjs";

/** F#34N — Fetch proof-of-edge from m2m internal (fail-open, never blocking). */
async function fetchProofOfEdge(m2mUrl, internalSecret) {
    try {
        const base = m2mUrl.replace(/\/$/, "");
        const resp = await axios.get(`${base}/api/m2m/internal/proof-of-edge`, {
            headers: { "X-M2M-Internal-Secret": internalSecret },
            timeout: 4000,
        });
        if (resp.data?.ok && resp.data?.proof_of_edge) {
            return resp.data.proof_of_edge;
        }
        return null;
    } catch {
        return null;
    }
}

const swapParamsSchema = {
    fromChain: z
        .union([z.number(), z.string()])
        .describe("Source Li.Fi chain id (e.g. 1 Ethereum, 8453 Base, 42161 Arbitrum)"),
    toChain: z
        .union([z.number(), z.string()])
        .describe("Destination Li.Fi chain id"),
    fromToken: z.string().describe("Source token contract address on fromChain"),
    toToken: z.string().describe("Destination token contract address on toChain"),
    fromAmount: z
        .string()
        .describe("Amount in token smallest units (wei for 18-decimal tokens)"),
    fromAddress: z.string().describe("Sender wallet 0x + 40 hex chars"),
    toAddress: z.string().describe("Recipient wallet 0x + 40 hex chars"),
    slippage: z.number().optional().describe("Max slippage percent (e.g. 0.5 for 0.5%)"),
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
        return toolTextResult(
            {
                error: err,
                pair: "BTC/USDC",
                pair_policy: terminalSwapPolicyMode(),
            },
            true,
        );
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
            description: toolDescriptionFromCard(
                "swap_via_nattswap",
                "Cross-chain swap via Li.Fi with step-by-step agent instructions. Free at MCP layer.",
            ),
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
            description: toolDescriptionFromCard(
                "swap_quote",
                "Raw Li.Fi swap quote JSON. Cross-chain. Free — no x402.",
            ),
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
 * Register free vault proof tool (Decision Core transparency).
 */
export function registerVaultProofTool(server, ctx) {
    const { m2mUrl, internalSecret } = ctx;
    const base = () => m2mUrl.replace(/\/$/, "");

    server.registerTool(
        "get_vault_proof",
        {
            description: toolDescriptionFromCard(
                "get_vault_proof",
                "Free proof we eat our own cooking: on-chain vault address, public URLs, signed cycle hash.",
            ),
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
                    proof_of_edge: await fetchProofOfEdge(m2mUrl, internalSecret),
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

/**
 * Register free Natt agent performance tool (Proof & Performance).
 */
export function registerNattPerformanceTool(server, ctx) {
    const { m2mUrl, internalSecret } = ctx;
    const base = () => m2mUrl.replace(/\/$/, "");

    server.registerTool(
        "get_natt_performance",
        {
            description: toolDescriptionFromCard(
                "get_natt_performance",
                "Free live P&L, win rate, and estimated APR from trading agent Natt on Base.",
            ),
            inputSchema: {},
        },
        async () => {
            if (!internalSecret) {
                return toolTextResult({ error: "MCP missing internal secret" }, true);
            }
            try {
                const response = await axios.get(
                    `${base()}/api/m2m/internal/natt/performance`,
                    {
                        headers: m2mHeaders(internalSecret),
                        timeout: 20000,
                    },
                );
                return toolTextResult({
                    ok: true,
                    source: "hypernatt-terminal",
                    data: response.data,
                    proof_of_edge: await fetchProofOfEdge(m2mUrl, internalSecret),
                });
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                const status = err.response?.status;
                const body = err.response?.data;
                return toolTextResult(
                    { error: "natt_performance_failed", status, message, body },
                    true,
                );
            }
        },
    );
}

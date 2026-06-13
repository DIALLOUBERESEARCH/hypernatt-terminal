/**
 * F#22 — MCP SSE + Streamable HTTP server for get_btc_usdc_signal (x402).
 *
 * Public (nginx strips /mcp prefix):
 *   GET  /mcp/sse       -> container /sse
 *   POST /mcp/messages  -> container /messages
 *   *    /mcp/protocol  -> container /protocol
 */
import crypto from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
    buildPaymentRequired,
    buildPaymentRequirements,
    fetchSignalPayload,
    parsePaymentHeader,
    summarizeCyclePayload,
    verifyPayment,
    SIGNAL_PAYTO,
    SIGNAL_PRICE_USDC,
} from "./x402-signal.mjs";
import {
    buildPaymentRequired as buildMmHuntPaymentRequired,
    buildPaymentRequirements as buildMmHuntPaymentRequirements,
    fetchMmHuntPayload,
    parsePaymentHeader as parseMmHuntPaymentHeader,
    summarizeMmHuntPayload,
    verifyPayment as verifyMmHuntPayment,
    MM_HUNT_PAYTO,
    MM_HUNT_PRICE_USDC,
} from "./x402-mm-hunt.mjs";
import {
    buildPaymentRequired as buildSimilarityPaymentRequired,
    buildPaymentRequirements as buildSimilarityPaymentRequirements,
    fetchSimilarityPayload,
    parsePaymentHeader as parseSimilarityPaymentHeader,
    summarizeSimilarityPayload,
    verifyPayment as verifySimilarityPayment,
    SIMILARITY_PAYTO,
    SIMILARITY_PRICE_USDC,
} from "./x402-similarity.mjs";
import {
    LIQ_RADAR_X402,
    MM_TRAP_STATE_X402,
} from "./x402-data-products.mjs";
import { settlePaymentWithFacilitator } from "./x402-facilitator-client.mjs";
import { extractPayerWallet, recordX402Event } from "./x402-telemetry.mjs";
import { checkBetaBypass, recordBetaPostCall } from "./x402-beta.mjs";
import { checkPaywallPrecheck, consumePaywall } from "./x402-quota.mjs";
import {
    registerTerminalCommerceTools,
    registerTerminalSwapTools,
    registerVaultProofTool,
    registerNattPerformanceTool,
} from "./mcp-free-tools.mjs";
import { registerGrowthTools } from "./mcp-growth-tools.mjs";

const M2M_URL = process.env.M2M_SERVICE_URL || "http://m2m-service:8010";
const INTERNAL_SECRET =
    process.env.M2M_INTERNAL_SECRET ||
    process.env.NATTSQUARE_INTERNAL_SECRET ||
    "";
const PUBLIC_SIGNAL_URL =
    process.env.PUBLIC_SIGNAL_URL || "https://hypernatt.com/api/m2m/signal";
const PUBLIC_MM_HUNT_URL =
    process.env.PUBLIC_MM_HUNT_URL || "https://hypernatt.com/api/m2m/mm-hunt";
const PUBLIC_SIMILARITY_MATCH_URL =
    process.env.PUBLIC_SIMILARITY_MATCH_URL ||
    "https://hypernatt.com/api/m2m/similarity-match";
const PUBLIC_LIQ_RADAR_URL =
    process.env.PUBLIC_LIQ_RADAR_URL ||
    "https://hypernatt.com/api/m2m/liq-radar";
const PUBLIC_MM_TRAP_STATE_URL =
    process.env.PUBLIC_MM_TRAP_STATE_URL ||
    "https://hypernatt.com/api/m2m/mm-trap-state";

import { toolDescriptionFromCard } from "./server-card-tools.mjs";

const SERVER_TITLE =
    "HyperNatt Terminal — BTC Decision Terminal for AI Agents";

const TERMINAL_ONCHAIN_PROOF = {
    ndatToken: {
        address: "0x7601550Ce343B8EC89ecC973987d68b938Bd77dd",
        basescan:
            "https://basescan.org/token/0x7601550Ce343B8EC89ecC973987d68b938Bd77dd",
    },
    anchorContract: {
        address: "0x920cCEa3BeED76DD7ebC2d3da2cFcDAAa323AcF7",
        basescan:
            "https://basescan.org/address/0x920cCEa3BeED76DD7ebC2d3da2cFcDAAa323AcF7",
    },
};

/** sessionId -> X-Payment header captured from HTTP POST */
const sessionPayments = new Map();

/** sessionId -> active MCP transport */
const transports = new Map();

function jsonToolResult(value, isError = false) {
    return {
        content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
        ...(isError ? { isError: true } : {}),
    };
}

/**
 * F#32N — shared payment phase for paid tools: telemetry on every funnel
 * step (402_shown / payment_invalid / payment_verified / payment_settled)
 * and on-chain settlement (the MCP path used to verify but NEVER settle).
 *
 * Returns { errorResult } to short-circuit, or { ok: true } to proceed.
 */
function normalizeAgentWallet(wallet) {
    if (typeof wallet !== "string") return null;
    const w = wallet.trim().toLowerCase();
    return /^0x[a-f0-9]{40}$/.test(w) ? w : null;
}

function onToolCallRecorded({
    wallet,
    tool,
    priceUsdc,
    sessionId,
    betaBypass = false,
    quotaBypass = false,
}) {
    if (!wallet) return;
    recordBetaPostCall({
        wallet,
        tool,
        outcome: quotaBypass
            ? "quota_bypass"
            : betaBypass
              ? "beta_bypass"
              : "ok",
        price_usdc: betaBypass || quotaBypass ? 0 : priceUsdc,
        session_id: sessionId || null,
    });
}

async function processPaidToolPayment({
    tool,
    priceUsdc,
    paymentRaw,
    agent_wallet,
    sessionId,
    mcp_client_id,
    parse,
    verify,
    buildRequired,
    buildRequirements: buildReqs,
}) {
    const headerWallet = normalizeAgentWallet(agent_wallet);
    const clientId = mcp_client_id || sessionId || null;

    if (headerWallet && (await checkBetaBypass(headerWallet, tool))) {
        console.log(`[F#36N] beta bypass MCP: ${headerWallet} → ${tool}`);
        return {
            ok: true,
            wallet: headerWallet,
            betaBypass: true,
            clientKey: null,
        };
    }

    const pre = await checkPaywallPrecheck({
        wallet: headerWallet,
        tool,
        mcpClientId: clientId,
        hasPayment: Boolean(paymentRaw),
    });

    if (!pre.allow) {
        recordX402Event({
            event_type: "402_shown",
            tool,
            price_usdc: priceUsdc,
        });
        return { errorResult: jsonToolResult(buildRequired(), true) };
    }

    const isSignal = tool === "get_btc_usdc_signal";

    if (!paymentRaw) {
        if (!isSignal) {
            const consumed = await consumePaywall({
                wallet: headerWallet,
                tool,
                clientKey: pre.clientKey,
            });
            if (consumed.consumed) {
                console.log(
                    `[F#40N] ${consumed.method || "paywall"} bypass MCP: ${headerWallet || pre.clientKey?.slice(0, 8)} → ${tool}`,
                );
                return {
                    ok: true,
                    wallet: headerWallet,
                    quotaBypass: consumed.method === "quota",
                    freeBypass: consumed.method === "free",
                    passBypass: consumed.method === "pass",
                    clientKey: pre.clientKey,
                };
            }
            recordX402Event({
                event_type: "402_shown",
                tool,
                price_usdc: priceUsdc,
            });
            return { errorResult: jsonToolResult(buildRequired(), true) };
        }
        return {
            ok: true,
            wallet: headerWallet,
            deferBilling: true,
            clientKey: pre.clientKey,
        };
    }

    let paymentPayload;
    try {
        paymentPayload = parse(paymentRaw);
    } catch {
        recordX402Event({
            event_type: "402_shown",
            tool,
            price_usdc: priceUsdc,
            detail: "invalid x_payment format",
        });
        return {
            errorResult: jsonToolResult(
                buildRequired("Invalid x_payment format"),
                true,
            ),
        };
    }

    const verification = await verify(paymentPayload);
    if (!verification.isValid) {
        recordX402Event({
            event_type: "payment_invalid",
            tool,
            payer_wallet: extractPayerWallet(paymentPayload),
            agent_id: extractPayerWallet(paymentPayload),
            price_usdc: priceUsdc,
            detail: String(verification.error || "").slice(0, 500),
            facilitator_error: String(verification.error || "").slice(0, 500),
        });
        return {
            errorResult: jsonToolResult(
                buildRequired(`Payment invalid: ${verification.error}`),
                true,
            ),
        };
    }

    const wallet = extractPayerWallet(paymentPayload);
    recordX402Event({
        event_type: "payment_verified",
        tool,
        payer_wallet: wallet,
        agent_id: wallet,
        price_usdc: priceUsdc,
    });

    if (!isSignal) {
        settlePaymentWithFacilitator(
            paymentPayload,
            paymentPayload?.accepted ?? buildReqs(),
        ).then((result) => {
            if (result.success) {
                console.log(
                    `[F#32N] 💰 ${tool} settled: ${result.txHash || "simulated"}`,
                );
                recordX402Event({
                    event_type: "payment_settled",
                    tool,
                    payer_wallet: wallet,
                    agent_id: wallet,
                    price_usdc: priceUsdc,
                    tx_hash: result.txHash || null,
                });
            }
        });
        return { ok: true, wallet, betaBypass: false, clientKey: pre.clientKey };
    }

    return {
        ok: true,
        wallet,
        betaBypass: false,
        deferBilling: isSignal,
        deferSettle: isSignal,
        paymentPayload,
        paymentRequirements: paymentPayload?.accepted ?? buildReqs(),
        clientKey: pre.clientKey,
    };
}

async function finalizeSignalMcpBilling(payment, payload) {
    const billing = await consumePaywall({
        wallet: payment.wallet,
        tool: "get_btc_usdc_signal",
        clientKey: payment.clientKey,
        signalPayload: payload,
    });

    if (billing.hold_free) {
        console.log("[F#40N] HOLD free MCP — no signal charge");
        return { ...payment, quotaBypass: false, holdFree: true };
    }

    if (billing.consumed) {
        return {
            ...payment,
            quotaBypass: billing.method === "quota",
            freeBypass: billing.method === "free",
            passBypass: billing.method === "pass",
        };
    }

    if (payment.deferSettle && payment.paymentPayload) {
        settlePaymentWithFacilitator(
            payment.paymentPayload,
            payment.paymentRequirements,
        ).then((result) => {
            if (result.success) {
                console.log(
                    `[F#32N] 💰 get_btc_usdc_signal settled: ${result.txHash || "simulated"}`,
                );
                recordX402Event({
                    event_type: "payment_settled",
                    tool: "get_btc_usdc_signal",
                    payer_wallet: payment.wallet,
                    agent_id: payment.wallet,
                    price_usdc: SIGNAL_PRICE_USDC,
                    tx_hash: result.txHash || null,
                });
            }
        });
    }

    return payment;
}

export function createMcpServer() {
    const server = new McpServer({
        name: "hypernatt-terminal",
        version: "2.5.2",
    });

    const freeCtx = {
        m2mUrl: M2M_URL,
        internalSecret: INTERNAL_SECRET,
        onchainProof: TERMINAL_ONCHAIN_PROOF,
    };
    registerGrowthTools(server, freeCtx);
    registerVaultProofTool(server, freeCtx);
    registerNattPerformanceTool(server, freeCtx);
    registerTerminalSwapTools(server, freeCtx);

    server.registerTool(
        "get_btc_usdc_signal",
        {
            description: toolDescriptionFromCard(
                "get_btc_usdc_signal",
                "Should I enter BTC now? Real-time cycle state from a live Hyperliquid vault.",
            ),
            inputSchema: {
                x_payment: z
                    .string()
                    .optional()
                    .describe(
                        "Optional x402 payment payload (base64 JSON). Omit to receive 402 payment instructions.",
                    ),
                full_payload: z
                    .boolean()
                    .optional()
                    .describe("If true, return full JSON; default summary only."),
                agent_wallet: z
                    .string()
                    .optional()
                    .describe(
                        "Optional EVM wallet (0x…). Beta-grandfathered wallets skip x402 payment.",
                    ),
            },
        },
        async ({ x_payment, full_payload, agent_wallet }, extra) => {
            let paymentRaw = x_payment;
            if (!paymentRaw && extra?.sessionId) {
                paymentRaw = sessionPayments.get(extra.sessionId);
            }

            const payment = await processPaidToolPayment({
                tool: "get_btc_usdc_signal",
                priceUsdc: SIGNAL_PRICE_USDC,
                paymentRaw,
                agent_wallet,
                sessionId: extra?.sessionId,
                parse: parsePaymentHeader,
                verify: verifyPayment,
                buildRequired: buildPaymentRequired,
                buildRequirements: buildPaymentRequirements,
            });
            if (payment.errorResult) {
                return payment.errorResult;
            }

            if (!INTERNAL_SECRET) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: "MCP server missing NATTSQUARE_INTERNAL_SECRET",
                            }),
                        },
                    ],
                    isError: true,
                };
            }

            try {
                const payload = await fetchSignalPayload(M2M_URL, INTERNAL_SECRET);
                const billed = await finalizeSignalMcpBilling(payment, payload);
                const out = full_payload ? payload : summarizeCyclePayload(payload);
                onToolCallRecorded({
                    wallet: billed.wallet,
                    tool: "get_btc_usdc_signal",
                    priceUsdc: billed.holdFree ? 0 : SIGNAL_PRICE_USDC,
                    sessionId: extra?.sessionId,
                    betaBypass: billed.betaBypass,
                    quotaBypass: billed.quotaBypass,
                });
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                {
                                    ok: true,
                                    source: "hypernatt_mimo_cycle_state_v1",
                                    public_url: PUBLIC_SIGNAL_URL,
                                    data: out,
                                },
                                null,
                                2,
                            ),
                        },
                    ],
                };
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: "signal_fetch_failed",
                                message,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
        },
    );

    server.registerTool(
        "get_mm_hunt_score",
        {
            description: toolDescriptionFromCard(
                "get_mm_hunt_score",
                "Is the Market Maker hunting your position? Live liquidation pressure score.",
            ),
            inputSchema: {
                x_payment: z
                    .string()
                    .optional()
                    .describe(
                        "Optional x402 payment payload (base64 JSON). Omit to receive 402 payment instructions.",
                    ),
                full_payload: z
                    .boolean()
                    .optional()
                    .describe("If true, return full JSON with inputs; default summary only."),
                agent_wallet: z
                    .string()
                    .optional()
                    .describe("Optional EVM wallet (0x…). Beta-grandfathered wallets skip x402."),
            },
        },
        async ({ x_payment, full_payload, agent_wallet }, extra) => {
            let paymentRaw = x_payment;
            if (!paymentRaw && extra?.sessionId) {
                paymentRaw = sessionPayments.get(extra.sessionId);
            }

            const payment = await processPaidToolPayment({
                tool: "get_mm_hunt_score",
                priceUsdc: MM_HUNT_PRICE_USDC,
                paymentRaw,
                agent_wallet,
                sessionId: extra?.sessionId,
                parse: parseMmHuntPaymentHeader,
                verify: verifyMmHuntPayment,
                buildRequired: buildMmHuntPaymentRequired,
                buildRequirements: buildMmHuntPaymentRequirements,
            });
            if (payment.errorResult) {
                return payment.errorResult;
            }

            if (!INTERNAL_SECRET) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: "MCP server missing NATTSQUARE_INTERNAL_SECRET",
                            }),
                        },
                    ],
                    isError: true,
                };
            }

            try {
                const payload = await fetchMmHuntPayload(
                    M2M_URL,
                    INTERNAL_SECRET,
                    full_payload === true,
                );
                const out = full_payload ? payload : summarizeMmHuntPayload(payload);
                onToolCallRecorded({
                    wallet: payment.wallet,
                    tool: "get_mm_hunt_score",
                    priceUsdc: MM_HUNT_PRICE_USDC,
                    sessionId: extra?.sessionId,
                    betaBypass: payment.betaBypass,
                    quotaBypass: payment.quotaBypass,
                });
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                {
                                    ok: true,
                                    source: "hypernatt_mm_hunt_score_v1",
                                    public_url: PUBLIC_MM_HUNT_URL,
                                    data: out,
                                },
                                null,
                                2,
                            ),
                        },
                    ],
                };
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: "mm_hunt_fetch_failed",
                                message,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
        },
    );

    server.registerTool(
        "get_similarity_match",
        {
            description: toolDescriptionFromCard(
                "get_similarity_match",
                "What happened last time BTC looked like this? Top-3 historical matches.",
            ),
            inputSchema: {
                x_payment: z
                    .string()
                    .optional()
                    .describe(
                        "Optional x402 payment payload (base64 JSON). Omit to receive 402 payment instructions.",
                    ),
                full_payload: z
                    .boolean()
                    .optional()
                    .describe(
                        "If true, return full JSON with feature vectors; default summary only.",
                    ),
                agent_wallet: z
                    .string()
                    .optional()
                    .describe("Optional EVM wallet (0x…). Beta-grandfathered wallets skip x402."),
            },
        },
        async ({ x_payment, full_payload, agent_wallet }, extra) => {
            let paymentRaw = x_payment;
            if (!paymentRaw && extra?.sessionId) {
                paymentRaw = sessionPayments.get(extra.sessionId);
            }

            const payment = await processPaidToolPayment({
                tool: "get_similarity_match",
                priceUsdc: SIMILARITY_PRICE_USDC,
                paymentRaw,
                agent_wallet,
                sessionId: extra?.sessionId,
                parse: parseSimilarityPaymentHeader,
                verify: verifySimilarityPayment,
                buildRequired: buildSimilarityPaymentRequired,
                buildRequirements: buildSimilarityPaymentRequirements,
            });
            if (payment.errorResult) {
                return payment.errorResult;
            }

            if (!INTERNAL_SECRET) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: "MCP server missing NATTSQUARE_INTERNAL_SECRET",
                            }),
                        },
                    ],
                    isError: true,
                };
            }

            try {
                const payload = await fetchSimilarityPayload(
                    M2M_URL,
                    INTERNAL_SECRET,
                    full_payload === true,
                );
                const out = full_payload
                    ? payload
                    : summarizeSimilarityPayload(payload);
                onToolCallRecorded({
                    wallet: payment.wallet,
                    tool: "get_similarity_match",
                    priceUsdc: SIMILARITY_PRICE_USDC,
                    sessionId: extra?.sessionId,
                    betaBypass: payment.betaBypass,
                    quotaBypass: payment.quotaBypass,
                });
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                {
                                    ok: true,
                                    source: "hypernatt_similarity_match_v1",
                                    public_url: PUBLIC_SIMILARITY_MATCH_URL,
                                    data: out,
                                },
                                null,
                                2,
                            ),
                        },
                    ],
                };
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: "similarity_match_fetch_failed",
                                message,
                            }),
                        },
                    ],
                    isError: true,
                };
            }
        },
    );

    // F#33N — paid data products (liq radar + MM trap state)
    const registerDataProductTool = (toolName, description, x402, sourceTag, publicUrl) => {
        server.registerTool(
            toolName,
            {
                description,
                inputSchema: {
                    x_payment: z
                        .string()
                        .optional()
                        .describe(
                            "Base64 x402 USDC payment on Base (eip155:8453). Omit on first call to receive 402 payment instructions; retry with header after paying $0.01/credit.",
                        ),
                    agent_wallet: z
                        .string()
                        .optional()
                        .describe(
                            "Optional EVM wallet (0x + 40 hex). Skips x402 when swap-earned quota balance covers this tool's credit weight (2 for liq_radar/mm_trap_state).",
                        ),
                },
            },
            async ({ x_payment, agent_wallet }, extra) => {
                let paymentRaw = x_payment;
                if (!paymentRaw && extra?.sessionId) {
                    paymentRaw = sessionPayments.get(extra.sessionId);
                }

                const payment = await processPaidToolPayment({
                    tool: toolName,
                    priceUsdc: x402.priceUsdc,
                    paymentRaw,
                    agent_wallet,
                    sessionId: extra?.sessionId,
                    parse: x402.parsePaymentHeader,
                    verify: x402.verifyPayment,
                    buildRequired: x402.buildPaymentRequired,
                    buildRequirements: x402.buildPaymentRequirements,
                });
                if (payment.errorResult) {
                    return payment.errorResult;
                }

                if (!INTERNAL_SECRET) {
                    return jsonToolResult(
                        { error: "MCP server missing NATTSQUARE_INTERNAL_SECRET" },
                        true,
                    );
                }

                try {
                    const payload = await x402.fetchPayload(M2M_URL, INTERNAL_SECRET);
                    onToolCallRecorded({
                        wallet: payment.wallet,
                        tool: toolName,
                        priceUsdc: x402.priceUsdc,
                        sessionId: extra?.sessionId,
                        betaBypass: payment.betaBypass,
                    quotaBypass: payment.quotaBypass,
                    });
                    return jsonToolResult({
                        ok: true,
                        source: sourceTag,
                        public_url: publicUrl,
                        data: payload,
                    });
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    return jsonToolResult(
                        { error: `${toolName}_fetch_failed`, message },
                        true,
                    );
                }
            },
        );
    };

    registerDataProductTool(
        "get_liq_radar",
        toolDescriptionFromCard(
            "get_liq_radar",
            "Where will the next BTC liquidation cascade hit? Raw cluster data.",
        ),
        LIQ_RADAR_X402,
        "hypernatt_liq_radar_v1",
        PUBLIC_LIQ_RADAR_URL,
    );
    registerDataProductTool(
        "get_mm_trap_state",
        toolDescriptionFromCard(
            "get_mm_trap_state",
            "Is the MM trapping right now? Flagship trap/sweep/reclaim weather: MM_TRAP_ACTIVE, hunt direction, sweep zones, chart_verdicts. 2 credits.",
        ),
        MM_TRAP_STATE_X402,
        "hypernatt_mm_trap_state_v1",
        PUBLIC_MM_TRAP_STATE_URL,
    );

    registerTerminalCommerceTools(server, freeCtx);

    return server;
}

function capturePaymentHeader(req, sessionId) {
    const xPay = req.headers["x-payment"] || req.headers["payment-signature"];
    if (sessionId && xPay) {
        sessionPayments.set(String(sessionId), xPay);
    }
}

/**
 * @param {import('express').Express} app
 */
export function mountMcpSignalRoutes(app) {
    app.get("/.well-known/mcp/server-card.json", (_req, res) => {
        if (SERVER_CARD) {
            res.json(SERVER_CARD);
            return;
        }
        res.status(404).json({ error: "server-card not configured" });
    });

    app.post("/internal/x402/create-payment", async (req, res) => {
        const secret =
            req.headers["x-m2m-internal-secret"] ||
            req.headers["X-M2M-Internal-Secret"];
        if (!INTERNAL_SECRET || secret !== INTERNAL_SECRET) {
            res.status(401).json({ error: "unauthorized" });
            return;
        }
        try {
            const { createX402PaymentPayload } = await import("./x402-buyer.mjs");
            const body = req.body?.paymentRequired ?? req.body;
            if (!body?.accepts?.length) {
                res.status(400).json({ error: "missing accepts[] in paymentRequired" });
                return;
            }
            const paymentPayload = await createX402PaymentPayload(body);
            res.json({ ok: true, paymentPayload });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error("[x402-buyer] create-payment failed:", message);
            res.status(500).json({ ok: false, error: message });
        }
    });

    app.get("/signal/info", (_req, res) => {
        res.json({
            name: "hypernatt-terminal",
            title: SERVER_TITLE,
            version: "2.5.2",
            tools: [
                "get_agent_manifest",
                "get_vault_proof",
                "get_natt_performance",
                "get_mm_trap_state",
                "get_btc_usdc_signal",
                "get_mm_hunt_score",
                "get_similarity_match",
                "get_liq_radar",
                "swap_via_nattswap",
                "swap_quote",
                "get_agent_balance",
                "claim_ndat",
                "register_nattswap_reward",
                "get_referral_link",
            ],
            transports: {
                sse: "/mcp/sse",
                messages: "/mcp/messages",
                streamable_http: "/mcp/protocol",
            },
            x402: {
                signal: {
                    price_usdc: SIGNAL_PRICE_USDC,
                    pay_to: SIGNAL_PAYTO,
                    public_url: PUBLIC_SIGNAL_URL,
                },
                mm_hunt: {
                    price_usdc: MM_HUNT_PRICE_USDC,
                    pay_to: MM_HUNT_PAYTO,
                    public_url: PUBLIC_MM_HUNT_URL,
                },
                similarity_match: {
                    price_usdc: SIMILARITY_PRICE_USDC,
                    pay_to: SIMILARITY_PAYTO,
                    public_url: PUBLIC_SIMILARITY_MATCH_URL,
                },
                liq_radar: {
                    price_usdc: LIQ_RADAR_X402.priceUsdc,
                    pay_to: LIQ_RADAR_X402.payTo,
                    public_url: PUBLIC_LIQ_RADAR_URL,
                },
                mm_trap_state: {
                    price_usdc: MM_TRAP_STATE_X402.priceUsdc,
                    pay_to: MM_TRAP_STATE_X402.payTo,
                    public_url: PUBLIC_MM_TRAP_STATE_URL,
                },
                network: "eip155:8453",
            },
            stats_url: "https://hypernatt.com/stats",
            products: [
                "hypernatt_mimo_cycle_state_v1",
                "hypernatt_mm_hunt_score_v1",
                "hypernatt_similarity_match_v1",
                "hypernatt_liq_radar_v1",
                "hypernatt_mm_trap_state_v1",
            ],
        });
    });

    // Streamable HTTP MCP (recommended)
    app.all("/protocol", async (req, res) => {
        try {
            const sessionId = req.headers["mcp-session-id"];
            capturePaymentHeader(req, sessionId);

            if (sessionId && transports.has(sessionId)) {
                const transport = transports.get(sessionId);
                if (!(transport instanceof StreamableHTTPServerTransport)) {
                    res.status(400).json({
                        error: "Session uses a different transport (SSE)",
                    });
                    return;
                }
                await transport.handleRequest(req, res, req.body);
                return;
            }

            if (req.method === "POST" && isInitializeRequest(req.body)) {
                const clientName = String(
                    req.body?.params?.clientInfo?.name || "unknown-client",
                ).slice(0, 200);
                recordX402Event({
                    event_type: "discovery",
                    tool: "_server",
                    client_source: clientName,
                    detail: clientName,
                });
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => crypto.randomUUID(),
                    onsessioninitialized: (id) => {
                        transports.set(id, transport);
                        capturePaymentHeader(req, id);
                    },
                });
                transport.onclose = () => {
                    if (transport.sessionId) {
                        transports.delete(transport.sessionId);
                        sessionPayments.delete(transport.sessionId);
                    }
                };
                const server = createMcpServer();
                await server.connect(transport);
                await transport.handleRequest(req, res, req.body);
                return;
            }

            res.status(400).json({
                error: "Initialize MCP with POST /mcp/protocol (Streamable HTTP)",
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error("[MCP Signal] protocol error:", message);
            if (!res.headersSent) {
                res.status(500).json({ error: "mcp_internal_error", message });
            }
        }
    });

    // Legacy SSE (public path /mcp/messages for client POST)
    app.get("/sse", async (req, res) => {
        const sseSource = `sse:${String(req.headers["user-agent"] || "").slice(0, 180)}`;
        recordX402Event({
            event_type: "discovery",
            tool: "_server",
            client_source: sseSource,
            detail: sseSource,
        });
        const server = createMcpServer();
        const transport = new SSEServerTransport("/mcp/messages", res);
        transports.set(transport.sessionId, transport);
        res.on("close", () => {
            transports.delete(transport.sessionId);
            sessionPayments.delete(transport.sessionId);
        });
        await server.connect(transport);
    });

    app.post("/messages", async (req, res) => {
        const sessionId = String(req.query.sessionId || "");
        capturePaymentHeader(req, sessionId);
        const transport = transports.get(sessionId);
        if (!(transport instanceof SSEServerTransport)) {
            res.status(400).json({ error: "Unknown or expired MCP SSE sessionId" });
            return;
        }
        await transport.handlePostMessage(req, res, req.body);
    });

    console.log("[MCP Terminal] hypernatt-terminal v2.5.0 — 14 tools");
    console.log(
        `[MCP Terminal] x402 get_liq_radar @ $${LIQ_RADAR_X402.priceUsdc} → ${LIQ_RADAR_X402.payTo}`,
    );
    console.log(
        `[MCP Terminal] x402 get_mm_trap_state @ $${MM_TRAP_STATE_X402.priceUsdc} → ${MM_TRAP_STATE_X402.payTo}`,
    );
    console.log(
        `[MCP Terminal] x402 get_btc_usdc_signal @ $${SIGNAL_PRICE_USDC} → ${SIGNAL_PAYTO}`,
    );
    console.log(
        `[MCP Terminal] x402 get_mm_hunt_score @ $${MM_HUNT_PRICE_USDC} → ${MM_HUNT_PAYTO}`,
    );
    console.log(
        `[MCP Terminal] x402 get_similarity_match @ $${SIMILARITY_PRICE_USDC} → ${SIMILARITY_PAYTO}`,
    );
    console.log("[MCP Terminal] SSE: /sse + /messages | Streamable: /protocol");
}

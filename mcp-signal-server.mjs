/**
 * F#22 — MCP SSE + Streamable HTTP server for get_btc_usdc_signal (x402).
 *
 * Public (nginx strips /mcp prefix):
 *   GET  /mcp/sse       -> container /sse
 *   POST /mcp/messages  -> container /messages
 *   *    /mcp/protocol  -> container /protocol
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
    buildPaymentRequired,
    fetchSignalPayload,
    parsePaymentHeader,
    summarizeCyclePayload,
    verifyPayment,
    SIGNAL_PAYTO,
    SIGNAL_PRICE_USDC,
} from "./x402-signal.mjs";
import {
    buildPaymentRequired as buildMmHuntPaymentRequired,
    fetchMmHuntPayload,
    parsePaymentHeader as parseMmHuntPaymentHeader,
    summarizeMmHuntPayload,
    verifyPayment as verifyMmHuntPayment,
    MM_HUNT_PAYTO,
    MM_HUNT_PRICE_USDC,
} from "./x402-mm-hunt.mjs";
import {
    buildPaymentRequired as buildSimilarityPaymentRequired,
    fetchSimilarityPayload,
    parsePaymentHeader as parseSimilarityPaymentHeader,
    summarizeSimilarityPayload,
    verifyPayment as verifySimilarityPayment,
    SIMILARITY_PAYTO,
    SIMILARITY_PRICE_USDC,
} from "./x402-similarity.mjs";
import {
    registerTerminalCommerceTools,
    registerTerminalSwapTools,
    registerVaultProofTool,
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let SERVER_CARD = null;
try {
    SERVER_CARD = JSON.parse(
        fs.readFileSync(path.join(__dirname, "server-card.json"), "utf8"),
    );
} catch {
    SERVER_CARD = null;
}

const TOOL_DESCRIPTION =
    "Fetch live BTC/USDC signal state from HyperNatt Mimo on Hyperliquid. " +
    "Returns direction, active cycle context (cycle state, legs, recent closed state), " +
    "and verifiable live performance metadata (win rate, trade count, proof links). " +
    "Pay-per-call: $0.01 USDC on Base via x402. Read-only output for agent workflows.";

const MM_HUNT_TOOL_DESCRIPTION =
    "Fetch BTC perp MM hunt / liquidation pressure score from HyperNatt microstructure stack. " +
    "Returns mm_hunt_score (= F#21 magnet.score -100..+100), long-trap phase (F#24), alert level, " +
    "and summarized OI/funding/taker/HLP vault inputs. Pay-per-call: $0.01 USDC on Base via x402. " +
    "Read-only JSON for agent risk context — not a trade signal.";

const SIMILARITY_TOOL_DESCRIPTION =
    "Find the top 3 historical BTC microstructure regimes most similar to now using HyperNatt live " +
    "liq_radar snapshots (~15m cadence). Returns cosine similarity %, match context, and observed ~4h " +
    "BTC price outcomes. Pay-per-call: $0.01 USDC on Base via x402. Read-only analogy for agents — not a trade signal.";

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

function createMcpServer() {
    const server = new McpServer({
        name: "hypernatt-terminal",
        version: "2.2.0",
    });

    const freeCtx = {
        m2mUrl: M2M_URL,
        internalSecret: INTERNAL_SECRET,
        onchainProof: TERMINAL_ONCHAIN_PROOF,
    };
    registerGrowthTools(server, freeCtx);
    registerVaultProofTool(server, freeCtx);
    registerTerminalSwapTools(server, freeCtx);

    server.registerTool(
        "get_btc_usdc_signal",
        {
            description: TOOL_DESCRIPTION,
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
            },
        },
        async ({ x_payment, full_payload }, extra) => {
            let paymentRaw = x_payment;
            if (!paymentRaw && extra?.sessionId) {
                paymentRaw = sessionPayments.get(extra.sessionId);
            }

            if (!paymentRaw) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(buildPaymentRequired(), null, 2),
                        },
                    ],
                    isError: true,
                };
            }

            let paymentPayload;
            try {
                paymentPayload = parsePaymentHeader(paymentRaw);
            } catch {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                buildPaymentRequired("Invalid x_payment format"),
                                null,
                                2,
                            ),
                        },
                    ],
                    isError: true,
                };
            }

            const verification = await verifyPayment(paymentPayload);
            if (!verification.isValid) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                buildPaymentRequired(
                                    `Payment invalid: ${verification.error}`,
                                ),
                                null,
                                2,
                            ),
                        },
                    ],
                    isError: true,
                };
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
                const out = full_payload ? payload : summarizeCyclePayload(payload);
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
            description: MM_HUNT_TOOL_DESCRIPTION,
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
            },
        },
        async ({ x_payment, full_payload }, extra) => {
            let paymentRaw = x_payment;
            if (!paymentRaw && extra?.sessionId) {
                paymentRaw = sessionPayments.get(extra.sessionId);
            }

            if (!paymentRaw) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(buildMmHuntPaymentRequired(), null, 2),
                        },
                    ],
                    isError: true,
                };
            }

            let paymentPayload;
            try {
                paymentPayload = parseMmHuntPaymentHeader(paymentRaw);
            } catch {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                buildMmHuntPaymentRequired("Invalid x_payment format"),
                                null,
                                2,
                            ),
                        },
                    ],
                    isError: true,
                };
            }

            const verification = await verifyMmHuntPayment(paymentPayload);
            if (!verification.isValid) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                buildMmHuntPaymentRequired(
                                    `Payment invalid: ${verification.error}`,
                                ),
                                null,
                                2,
                            ),
                        },
                    ],
                    isError: true,
                };
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
            description: SIMILARITY_TOOL_DESCRIPTION,
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
            },
        },
        async ({ x_payment, full_payload }, extra) => {
            let paymentRaw = x_payment;
            if (!paymentRaw && extra?.sessionId) {
                paymentRaw = sessionPayments.get(extra.sessionId);
            }

            if (!paymentRaw) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                buildSimilarityPaymentRequired(),
                                null,
                                2,
                            ),
                        },
                    ],
                    isError: true,
                };
            }

            let paymentPayload;
            try {
                paymentPayload = parseSimilarityPaymentHeader(paymentRaw);
            } catch {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                buildSimilarityPaymentRequired(
                                    "Invalid x_payment format",
                                ),
                                null,
                                2,
                            ),
                        },
                    ],
                    isError: true,
                };
            }

            const verification = await verifySimilarityPayment(paymentPayload);
            if (!verification.isValid) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(
                                buildSimilarityPaymentRequired(
                                    `Payment invalid: ${verification.error}`,
                                ),
                                null,
                                2,
                            ),
                        },
                    ],
                    isError: true,
                };
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

    app.get("/signal/info", (_req, res) => {
        res.json({
            name: "hypernatt-terminal",
            title: SERVER_TITLE,
            version: "2.2.0",
            tools: [
                "get_agent_manifest",
                "get_vault_proof",
                "get_btc_usdc_signal",
                "get_mm_hunt_score",
                "get_similarity_match",
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
                network: "eip155:8453",
            },
            stats_url: "https://hypernatt.com/stats",
            products: [
                "hypernatt_mimo_cycle_state_v1",
                "hypernatt_mm_hunt_score_v1",
                "hypernatt_similarity_match_v1",
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

    console.log("[MCP Terminal] hypernatt-terminal v2.0.0 — 9 tools");
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

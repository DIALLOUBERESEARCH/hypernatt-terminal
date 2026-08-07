/**
 * Agent Growth Layer — get_agent_manifest (thin m2m proxy).
 */
import axios from "axios";
import { z } from "zod";
import { toolDescriptionFromCard } from "./server-card-tools.mjs";

/** F#34N — Fetch proof-of-edge from m2m internal (fail-open). */
async function fetchProofOfEdge(m2mUrl, internalSecret) {
    if (!internalSecret) return null;
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

function toolTextResult(obj, isError = false) {
    return {
        content: [{ type: "text", text: JSON.stringify(obj, null, 2) }],
        isError,
    };
}

export function registerGrowthTools(server, ctx) {
    const { m2mUrl, internalSecret } = ctx;
    const base = () => m2mUrl.replace(/\/$/, "");

    server.registerTool(
        "get_agent_manifest",
        {
            description: toolDescriptionFromCard(
                "get_agent_manifest",
                "Start here: catalog of 3 terminal tools with prices, live usage stats, and journeys. Free.",
            ),
            inputSchema: {
                locale: z
                    .string()
                    .optional()
                    .describe("en or fr (default en)"),
            },
        },
        async ({ locale }, extra) => {
            try {
                const params = locale ? { locale } : {};
                const headers = { "X-M2M-Transport": "mcp" };
                const sessionId = extra?.sessionId;
                if (sessionId && String(sessionId).length >= 8) {
                    headers["X-M2M-Client-Id"] = String(sessionId);
                }
                const response = await axios.get(`${base()}/api/m2m/agent/manifest`, {
                    params,
                    headers,
                    timeout: 15000,
                });
                const poe = await fetchProofOfEdge(m2mUrl, internalSecret);
                const data = poe
                    ? { ...response.data, proof_of_edge: poe }
                    : response.data;
                return toolTextResult(data);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                const status = err.response?.status;
                const body = err.response?.data;
                return toolTextResult(
                    { error: "manifest_unavailable", status, message, body },
                    true,
                );
            }
        },
    );
}

/**
 * Agent Growth Layer — get_agent_manifest (thin m2m proxy).
 */
import axios from "axios";
import { z } from "zod";

function toolTextResult(obj, isError = false) {
    return {
        content: [{ type: "text", text: JSON.stringify(obj, null, 2) }],
        isError,
    };
}

export function registerGrowthTools(server, ctx) {
    const { m2mUrl } = ctx;
    const base = () => m2mUrl.replace(/\/$/, "");

    server.registerTool(
        "get_agent_manifest",
        {
            description:
                "Start here: ordered catalog of all 9 HyperNatt Terminal tools with prices, journey, and live usage stats. Free.",
            inputSchema: {
                locale: z
                    .string()
                    .optional()
                    .describe("en or fr (default en)"),
            },
        },
        async ({ locale }) => {
            try {
                const params = locale ? { locale } : {};
                const response = await axios.get(`${base()}/api/m2m/agent/manifest`, {
                    params,
                    timeout: 15000,
                });
                return toolTextResult(response.data);
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

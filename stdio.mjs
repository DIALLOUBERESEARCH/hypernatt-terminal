/**
 * Stdio MCP entry for Glama Docker quality checks (mcp-proxy -- node stdio.mjs).
 * Production agents use HTTP Streamable: node server.js → /protocol
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./mcp-signal-server.mjs";

async function main() {
    const server = createMcpServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((err) => {
    console.error("[hypernatt-terminal] stdio MCP failed:", err);
    process.exit(1);
});

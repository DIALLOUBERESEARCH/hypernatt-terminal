/**
 * Shared server-card.json loader for MCP tool descriptions (Glama TDQS source of truth).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let SERVER_CARD = null;
try {
    SERVER_CARD = JSON.parse(
        fs.readFileSync(path.join(__dirname, "server-card.json"), "utf8"),
    );
} catch {
    SERVER_CARD = null;
}

/** Smithery/Glama tools/list — prefer server-card description over fallback. */
export function toolDescriptionFromCard(toolName, fallback = "") {
    if (!SERVER_CARD?.tools) return fallback;
    const row = SERVER_CARD.tools.find((t) => t.name === toolName);
    return row?.description || fallback;
}

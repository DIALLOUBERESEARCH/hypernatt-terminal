/**
 * Build-time gate: server-card.json must list exactly 14 terminal tools.
 * Glama/Smithery introspection uses the same registry via createMcpServer().
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const cardPath = path.join(root, "server-card.json");

const EXPECTED_COUNT = 14;
const EXPECTED_TOOLS = [
    "get_agent_manifest",
    "get_vault_proof",
    "get_natt_performance",
    "get_btc_usdc_signal",
    "get_mm_hunt_score",
    "get_similarity_match",
    "get_liq_radar",
    "get_mm_trap_state",
    "swap_via_nattswap",
    "swap_quote",
    "get_agent_balance",
    "claim_ndat",
    "register_nattswap_reward",
    "get_referral_link",
].sort();

const card = JSON.parse(fs.readFileSync(cardPath, "utf8"));
const names = (card.tools || []).map((t) => t.name).sort();
const version = card.serverInfo?.version || "unknown";

if (names.length !== EXPECTED_COUNT) {
    console.error(
        `[verify-mcp-tool-count] FAIL: server-card has ${names.length} tools, expected ${EXPECTED_COUNT} (v${version})`,
    );
    process.exit(1);
}

const missing = EXPECTED_TOOLS.filter((n) => !names.includes(n));
const extra = names.filter((n) => !EXPECTED_TOOLS.includes(n));
if (missing.length || extra.length) {
    console.error("[verify-mcp-tool-count] FAIL: tool name mismatch");
    if (missing.length) console.error("  missing:", missing.join(", "));
    if (extra.length) console.error("  extra:", extra.join(", "));
    process.exit(1);
}

console.log(
    `[verify-mcp-tool-count] OK v${version}: ${EXPECTED_COUNT} tools — ${names.join(", ")}`,
);

const tdqsRequired = [
    "get_mm_trap_state",
    "get_liq_radar",
    "get_agent_balance",
    "claim_ndat",
    "swap_via_nattswap",
];
for (const toolName of tdqsRequired) {
    const row = (card.tools || []).find((t) => t.name === toolName);
    const desc = row?.description || "";
    if (!desc.includes("USE WHEN:") || !desc.includes("RETURNS:")) {
        console.error(
            `[verify-mcp-tool-count] FAIL: ${toolName} missing TDQS fields (USE WHEN / RETURNS) — Glama will grade B`,
        );
        process.exit(1);
    }
}
if ((card.tools || []).some((t) => /Beta.*grandfather/i.test(t.description || ""))) {
    console.error("[verify-mcp-tool-count] FAIL: stale Beta/grandfather text in server-card");
    process.exit(1);
}
console.log("[verify-mcp-tool-count] TDQS gate OK");

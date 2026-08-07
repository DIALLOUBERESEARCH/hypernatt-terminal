/**
 * F#43N — agent-readable MCP payment errors (MCP server mirror of lib/agent-payment-error.ts).
 */

const FREE_TOOLS_ALWAYS_WORK = [
    "get_agent_manifest",
    "swap_via_nattswap",
];

function dailyCap() {
    return parseInt(process.env.X402_FREE_DAILY_CREDITS || "25", 10);
}

function humanMessage({ reasonCode, tool, creditsRemaining, dailyCap: cap }) {
    const daily = cap ?? dailyCap();
    const rem = creditsRemaining ?? 0;
    if (reasonCode === "PAYWALL_UNAVAILABLE") {
        return (
            "HyperNatt paywall check is temporarily unavailable. " +
            "Free tools get_agent_manifest and swap_via_nattswap still work — retry in a minute."
        );
    }
    if (reasonCode === "PAYMENT_REQUIRED") {
        return (
            `Payment required for ${tool}. ` +
            "Connect a wallet with swap quota, Agent Pass ($5/mo), or pay $0.001 USDC per call on Base or Solana."
        );
    }
    return (
        `Free trial credits used (${rem}/${daily} pool remaining today UTC). ` +
        "get_agent_manifest and swap_via_nattswap still work. " +
        "Swap via NattSwap for bonus credits, Agent Pass $5/mo, or retry tomorrow UTC."
    );
}

export function buildAgentPaymentRequiredBlock(input) {
    const daily = input.dailyCap ?? dailyCap();
    const swapTool =
        input.tool === "swap_quote" || input.tool === "swap_via_nattswap";
    const nextSteps = swapTool
        ? [
              "Call get_agent_manifest and read wallet_onboarding_v1 under Execution",
              "Use swap_via_nattswap MCP with YOUR agent wallet as fromAddress (not a vault address)",
              "https://github.com/DIALLOUBE-RESEARCH/hypernatt-terminal/blob/main/docs/swap-agentkit.md",
              "After on-chain swap: POST /api/m2m/swap/register for quota credits",
          ]
        : [
              "Call get_agent_manifest for live free_tier_status_v1 and pricing",
              "Register a NattSwap to earn bonus credits",
              "Retry tomorrow UTC or pass x_payment for paygo",
          ];
    return {
        version: "1",
        reason_code: input.reasonCode,
        human_message_en: humanMessage({ ...input, dailyCap: daily }),
        tool: input.tool,
        credits_remaining: input.creditsRemaining ?? 0,
        daily_cap: daily,
        intro_free_available: input.introFreeAvailable ?? {},
        free_tools_always_work: FREE_TOOLS_ALWAYS_WORK,
        next_steps_en: nextSteps,
    };
}

export function enrichPaymentRequiredPayload(base, input) {
    if (process.env.MCP_AGENT_PAYMENT_ERROR_V1_ENABLED === "false") {
        return base;
    }
    return {
        agent_payment_required_v1: buildAgentPaymentRequiredBlock(input),
        ...base,
    };
}

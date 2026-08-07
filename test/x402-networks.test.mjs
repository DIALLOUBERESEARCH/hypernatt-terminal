import assert from "node:assert/strict";
import test from "node:test";
import {
    buildAccepts,
    buildSolanaRequirementFromBase,
    isSolanaNetwork,
    isSolanaX402Enabled,
    solanaPayTo,
} from "../x402-networks.mjs";
import { normalizePaymentRequirements } from "../x402-facilitator-client.mjs";

const OWNER_SOLANA_PAYTO = "2hAXt3sb2GZrtXx4ae4Ywc7enqrE191nktyL5k2nWSfg";
const USDC_SPL_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// A realistic Base (EVM) requirement, mirroring what the tools build.
function baseReq() {
    return {
        scheme: "exact",
        network: "eip155:8453",
        maxAmountRequired: "1000",
        amount: "1000",
        payTo: "0x5a78ace5dd133316c8aaf7e156fbfc57e1209cf9",
        maxTimeoutSeconds: 60,
        asset: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
        extra: { name: "USD Coin", version: "2", decimals: 6 },
        resource: "https://hypernatt.com/mcp/protocol",
        description: "Pay $0.001 USDC on Base to access: live BTC signal",
        mimeType: "application/json",
    };
}

function withFlag(value, fn) {
    const prev = process.env.MIMO_SIGNAL_X402_SOLANA_ENABLED;
    process.env.MIMO_SIGNAL_X402_SOLANA_ENABLED = value;
    try {
        return fn();
    } finally {
        if (prev === undefined) delete process.env.MIMO_SIGNAL_X402_SOLANA_ENABLED;
        else process.env.MIMO_SIGNAL_X402_SOLANA_ENABLED = prev;
    }
}

// P1 - flag gates the Solana rail; Base is always present and unchanged.
test("buildAccepts: flag OFF -> Base only", () => {
    withFlag("false", () => {
        const accepts = buildAccepts(baseReq());
        assert.equal(accepts.length, 1);
        assert.equal(accepts[0].network, "eip155:8453");
    });
});

test("buildAccepts: flag ON -> Base + Solana (Base entry untouched)", () => {
    withFlag("true", () => {
        const base = baseReq();
        const accepts = buildAccepts(base);
        assert.equal(accepts.length, 2);
        assert.deepEqual(accepts[0], base); // Base entry byte-identical (I3)
        assert.ok(isSolanaNetwork(accepts[1].network));
        assert.equal(accepts[1].scheme, "exact");
    });
});

// P3/I4 - same dollar amount on both rails (same atomic units).
test("Solana entry mirrors the Base atomic amount", () => {
    const sol = buildSolanaRequirementFromBase(baseReq());
    assert.equal(sol.amount, "1000");
    assert.equal(sol.maxAmountRequired, "1000");
});

// P4/I2 - Solana payTo is the owner treasury, case-exact (base58, never lowercased).
test("Solana payTo = owner treasury, case preserved", () => {
    const sol = buildSolanaRequirementFromBase(baseReq());
    assert.equal(sol.payTo, OWNER_SOLANA_PAYTO);
    assert.equal(solanaPayTo(), OWNER_SOLANA_PAYTO);
    // mixed-case base58 must survive verbatim
    assert.notEqual(sol.payTo, sol.payTo.toLowerCase());
});

test("Solana asset = USDC SPL mint, case preserved + feePayer extra present", () => {
    const sol = buildSolanaRequirementFromBase(baseReq());
    assert.equal(sol.asset, USDC_SPL_MINT);
    assert.notEqual(sol.asset, sol.asset.toLowerCase());
    assert.ok(sol.extra && typeof sol.extra.feePayer === "string" && sol.extra.feePayer.length > 0);
});

test("description swaps Base -> Solana", () => {
    const sol = buildSolanaRequirementFromBase(baseReq());
    assert.ok(sol.description.includes("on Solana"));
    assert.ok(!/on Base\b/i.test(sol.description));
});

test("isSolanaNetwork: solana CAIP-2 true, eip155 false", () => {
    assert.equal(isSolanaNetwork("solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"), true);
    assert.equal(isSolanaNetwork("eip155:8453"), false);
    assert.equal(isSolanaNetwork(undefined), false);
});

// P2/I2 - the critical money invariant in the facilitator client:
// Solana base58 payTo/asset must NOT be lowercased; EVM hex still is.
test("normalizePaymentRequirements: Solana base58 NOT lowercased", () => {
    const out = normalizePaymentRequirements({
        scheme: "exact",
        network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
        amount: "1000",
        payTo: OWNER_SOLANA_PAYTO,
        asset: USDC_SPL_MINT,
        extra: { feePayer: "D6ZhtNQ5nT9ZnTHUbqXZsTx5MH2rPFiBBggX4hY1WePM" },
    });
    assert.equal(out.payTo, OWNER_SOLANA_PAYTO); // case preserved (not lowercased)
    assert.equal(out.asset, USDC_SPL_MINT);
    assert.deepEqual(out.extra, { feePayer: "D6ZhtNQ5nT9ZnTHUbqXZsTx5MH2rPFiBBggX4hY1WePM" });
});

test("normalizePaymentRequirements: EVM hex still lowercased (unchanged)", () => {
    const out = normalizePaymentRequirements({
        scheme: "exact",
        network: "eip155:8453",
        amount: "1000",
        payTo: "0x5A78ACE5DD133316C8AAF7E156FBFC57E1209CF9",
        asset: "0x833589FCD6EDB6E08F4C7C32D4F71B54BDA02913",
    });
    assert.equal(out.payTo, "0x5a78ace5dd133316c8aaf7e156fbfc57e1209cf9");
    assert.equal(out.asset, "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913");
    assert.equal(out.extra.assetTransferMethod, "eip3009"); // EVM default preserved
});

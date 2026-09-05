import assert from "node:assert/strict";
import test from "node:test";
import {
    extractPayerWallet,
    extractSolanaPayerFromTx,
    networkFromPayload,
} from "../x402-telemetry.mjs";

test("MCP x402-telemetry: EVM authorization.from extracted + lowercased", () => {
    const evm = "0xAbCdef0123456789abcdef0123456789ABCDEF01";
    const w = extractPayerWallet({ payload: { authorization: { from: evm } } });
    assert.equal(w, evm.toLowerCase());
});

test("MCP x402-telemetry: Solana top-level and nested fields case preserved", () => {
    const sol = "2hAXt3sb2GZrtXx4ae4Ywc7enqrE191nktyL5k2nWSfg";
    assert.equal(extractPayerWallet({ from: sol }), sol);
    assert.equal(extractPayerWallet({ payload: { account: sol } }), sol);
});

test("MCP x402-telemetry: extractSolanaPayerFromTx decodes v0 VersionedTransaction", () => {
    const key1 = Buffer.alloc(32, 1);
    const key2 = Buffer.alloc(32, 2);
    // 1 sig (64 0s), v0 (0x80), 2 req sigs, 0, 0, 2 accounts (key1, key2)
    const v0Buf = Buffer.concat([
        Buffer.from([1]),
        Buffer.alloc(64, 0),
        Buffer.from([0x80, 2, 0, 0, 2]),
        key1,
        key2,
    ]);
    const b64 = v0Buf.toString("base64");
    const feePayer = "4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi";
    const buyer = "8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR";

    // Without feePayer hint: returns key1
    assert.equal(extractSolanaPayerFromTx(b64), feePayer);
    // With feePayer hint: returns buyer key2
    assert.equal(extractSolanaPayerFromTx(b64, feePayer), buyer);

    // Integrated via extractPayerWallet
    assert.equal(
        extractPayerWallet({
            payload: { transaction: b64 },
            accepted: { extra: { feePayer } },
        }),
        buyer,
    );
});

test("MCP x402-telemetry: garbage transactions return null without throwing", () => {
    assert.equal(extractSolanaPayerFromTx("garbage-not-base64"), null);
    assert.equal(extractSolanaPayerFromTx(Buffer.from("short").toString("base64")), null);
    assert.equal(extractPayerWallet({ payload: { transaction: "invalid" } }), null);
});

test("MCP x402-telemetry: networkFromPayload handles CAIP-2", () => {
    assert.equal(
        networkFromPayload({ accepted: { network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" } }),
        "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    );
    assert.equal(networkFromPayload({ network: "eip155:8453" }), "eip155:8453");
    assert.equal(networkFromPayload(null), null);
});

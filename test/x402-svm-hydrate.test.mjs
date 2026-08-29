import assert from "node:assert/strict";
import test from "node:test";
import {
    hydrateSvmPaymentPayload,
    PayToMismatchError,
    isSvmCompatEnabled,
} from "../x402-svm-hydrate.mjs";
import { preparePaymentForCdp } from "../x402-svm-prepare.mjs";
import {
    buildAccepts,
    selectRequirementForPayload,
} from "../x402-networks.mjs";
import {
    refreshSolanaAta,
    resetSolanaAtaCache,
    setSolanaAtaStateForTest,
    shouldAppendSolanaAccept,
} from "../x402-svm-ata.mjs";

const OWNER_SOLANA_PAYTO = "2hAXt3sb2GZrtXx4ae4Ywc7enqrE191nktyL5k2nWSfg";
const USDC_SPL_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

function svmReq() {
    return {
        scheme: "exact",
        network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
        asset: USDC_SPL_MINT,
        amount: "1000",
        maxAmountRequired: "1000",
        payTo: OWNER_SOLANA_PAYTO,
        maxTimeoutSeconds: 60,
        extra: { feePayer: "D6ZhtNQ5nT9ZnTHUbqXZsTx5MH2rPFiBBggX4hY1WePM" },
    };
}

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

function withEnv(map, fn) {
    const prev = {};
    for (const [k, v] of Object.entries(map)) {
        prev[k] = process.env[k];
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
    }
    try {
        return fn();
    } finally {
        for (const [k, v] of Object.entries(prev)) {
            if (v === undefined) delete process.env[k];
            else process.env[k] = v;
        }
        resetSolanaAtaCache();
    }
}

test("hydrate: missing asset -> server mint", () => {
    const out = hydrateSvmPaymentPayload(
        {
            accepted: { network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" },
        },
        svmReq(),
    );
    assert.equal(out.accepted.asset, USDC_SPL_MINT);
});

test("hydrate: EVM identity same reference", () => {
    const payload = { network: "eip155:8453", accepted: { network: "eip155:8453" } };
    const out = hydrateSvmPaymentPayload(payload, baseReq());
    assert.equal(out, payload);
});

test("hydrate: payTo mismatch throws", () => {
    assert.throws(
        () =>
            hydrateSvmPaymentPayload(
                {
                    accepted: {
                        network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
                        payTo: "11111111111111111111111111111111",
                    },
                },
                svmReq(),
            ),
        (err) => err instanceof PayToMismatchError,
    );
});

test("selectRequirementForPayload: flag ON + solana -> Solana req", () => {
    withEnv({ MIMO_SIGNAL_X402_SOLANA_ENABLED: "true" }, () => {
        const r = selectRequirementForPayload(
            { accepted: { network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" } },
            baseReq(),
        );
        assert.ok(String(r.network).startsWith("solana:"));
        assert.equal(r.payTo, OWNER_SOLANA_PAYTO);
        assert.equal(r.asset, USDC_SPL_MINT);
    });
});

test("preparePaymentForCdp: flag off is identity (mutant: flag ignored)", () => {
    withEnv(
        {
            MIMO_SIGNAL_X402_SVM_COMPAT_ENABLED: "false",
            MIMO_SIGNAL_X402_SOLANA_ENABLED: "true",
        },
        () => {
            assert.equal(isSvmCompatEnabled(), false);
            const payload = {
                accepted: { network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" },
            };
            const { payload: out, serverReq } = preparePaymentForCdp(
                payload,
                baseReq(),
            );
            assert.equal(out, payload);
            assert.equal(serverReq.network, "eip155:8453");
            assert.equal(out.accepted.asset, undefined);
        },
    );
});

test("preparePaymentForCdp: flag on hydrates SVM asset (mutant: skip hydrate)", () => {
    withEnv(
        {
            MIMO_SIGNAL_X402_SVM_COMPAT_ENABLED: "true",
            MIMO_SIGNAL_X402_SOLANA_ENABLED: "true",
        },
        () => {
            const { payload, serverReq } = preparePaymentForCdp(
                {
                    accepted: {
                        network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
                    },
                },
                baseReq(),
            );
            assert.ok(String(serverReq.network).startsWith("solana:"));
            assert.equal(payload.accepted.asset, USDC_SPL_MINT);
            assert.equal(payload.accepted.payTo, OWNER_SOLANA_PAYTO);
        },
    );
});

test("buildAccepts: compat on + ATA empty -> Base only (mutant: always append)", () => {
    withEnv(
        {
            MIMO_SIGNAL_X402_SOLANA_ENABLED: "true",
            MIMO_SIGNAL_X402_SVM_COMPAT_ENABLED: "true",
        },
        () => {
            setSolanaAtaStateForTest("empty");
            assert.equal(shouldAppendSolanaAccept(), false);
            const accepts = buildAccepts(baseReq());
            assert.equal(accepts.length, 1);
            assert.equal(accepts[0].network, "eip155:8453");
        },
    );
});

test("buildAccepts: compat off + ATA empty still appends Solana", () => {
    withEnv(
        {
            MIMO_SIGNAL_X402_SOLANA_ENABLED: "true",
            MIMO_SIGNAL_X402_SVM_COMPAT_ENABLED: "false",
        },
        () => {
            setSolanaAtaStateForTest("empty");
            const accepts = buildAccepts(baseReq());
            assert.equal(accepts.length, 2);
        },
    );
});

test("refreshSolanaAta mock empty vs one account", async () => {
    resetSolanaAtaCache();
    const empty = await refreshSolanaAta({
        fetchImpl: async () => ({
            ok: true,
            json: async () => ({ result: { value: [] } }),
        }),
    });
    assert.equal(empty, "empty");
    resetSolanaAtaCache();
    const ok = await refreshSolanaAta({
        fetchImpl: async () => ({
            ok: true,
            json: async () => ({ result: { value: [{}] } }),
        }),
    });
    assert.equal(ok, "ok");
});

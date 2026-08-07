import assert from "node:assert/strict";
import test from "node:test";
import {
    attachBuilderCodeToPaymentRequired,
    buildBuilderCodeExtensions,
    declareBuilderCodeExtension,
} from "../x402-builder-code.mjs";

const prevCode = process.env.BASE_BUILDER_CODE;
const prevEnabled = process.env.BASE_BUILDER_CODE_ENABLED;

test.after(() => {
    if (prevCode === undefined) {
        delete process.env.BASE_BUILDER_CODE;
    } else {
        process.env.BASE_BUILDER_CODE = prevCode;
    }
    if (prevEnabled === undefined) {
        delete process.env.BASE_BUILDER_CODE_ENABLED;
    } else {
        process.env.BASE_BUILDER_CODE_ENABLED = prevEnabled;
    }
});

test("declareBuilderCodeExtension matches x402 spec", () => {
    const ext = declareBuilderCodeExtension("bc_44pslzw2");
    assert.ok(ext);
    assert.equal(ext["builder-code"].info.a, "bc_44pslzw2");
    assert.equal(
        ext["builder-code"].schema.properties.a.pattern,
        "^[a-z0-9_]{1,32}$",
    );
});

test("attachBuilderCodeToPaymentRequired adds extension when enabled", () => {
    process.env.BASE_BUILDER_CODE = "bc_44pslzw2";
    process.env.BASE_BUILDER_CODE_ENABLED = "true";
    const body = attachBuilderCodeToPaymentRequired({
        x402Version: 2,
        accepts: [],
    });
    assert.equal(body.extensions["builder-code"].info.a, "bc_44pslzw2");
    delete process.env.BASE_BUILDER_CODE;
    delete process.env.BASE_BUILDER_CODE_ENABLED;
});

test("buildBuilderCodeExtensions empty when kill switch off", () => {
    process.env.BASE_BUILDER_CODE = "bc_44pslzw2";
    process.env.BASE_BUILDER_CODE_ENABLED = "false";
    assert.deepEqual(buildBuilderCodeExtensions(), {});
    delete process.env.BASE_BUILDER_CODE;
    delete process.env.BASE_BUILDER_CODE_ENABLED;
});

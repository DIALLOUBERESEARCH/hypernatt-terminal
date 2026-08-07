/**
 * F#48N — Base Builder Code extension for MCP x402 402 payloads.
 * Mirrors lib/x402-builder-code.ts (MCP container runs plain .mjs).
 */

export const BUILDER_CODE_KEY = "builder-code";
export const BUILDER_CODE_PATTERN = /^[a-z0-9_]{1,32}$/;

const BUILDER_CODE_SCHEMA = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {
        a: {
            type: "string",
            pattern: "^[a-z0-9_]{1,32}$",
            description: "App builder code",
        },
        w: {
            type: "string",
            pattern: "^[a-z0-9_]{1,32}$",
            description: "Wallet builder code",
        },
        s: {
            type: "array",
            items: {
                type: "string",
                pattern: "^[a-z0-9_]{1,32}$",
            },
            description: "Service builder codes",
        },
    },
    additionalProperties: false,
};

export function getBaseBuilderCode() {
    const raw = String(process.env.BASE_BUILDER_CODE || "").trim();
    if (!raw || !BUILDER_CODE_PATTERN.test(raw)) {
        return null;
    }
    return raw;
}

export function isBaseBuilderCodeEnabled() {
    return (
        String(process.env.BASE_BUILDER_CODE_ENABLED || "")
            .trim()
            .toLowerCase() === "true"
    );
}

export function declareBuilderCodeExtension(appCode) {
    if (!BUILDER_CODE_PATTERN.test(appCode)) {
        return null;
    }
    return {
        [BUILDER_CODE_KEY]: {
            info: { a: appCode },
            schema: BUILDER_CODE_SCHEMA,
        },
    };
}

export function buildBuilderCodeExtensions() {
    if (!isBaseBuilderCodeEnabled()) {
        return {};
    }
    const code = getBaseBuilderCode();
    if (!code) {
        return {};
    }
    return declareBuilderCodeExtension(code) ?? {};
}

export function mergeX402Extensions(base) {
    const builder = buildBuilderCodeExtensions();
    if (!Object.keys(builder).length) {
        return base ?? {};
    }
    return { ...(base ?? {}), ...builder };
}

export function attachBuilderCodeToPaymentRequired(body) {
    const merged = mergeX402Extensions(body.extensions);
    if (!body.extensions && !Object.keys(merged).length) {
        return body;
    }
    return { ...body, extensions: merged };
}

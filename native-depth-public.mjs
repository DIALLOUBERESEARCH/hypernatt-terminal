import axios from "axios";
import { z } from "zod";
import { createDataProductX402 } from "./x402-data-products.mjs";
import { NATIVE_DEPTH_TOOL, nativeDepthEnabled } from "./native-depth-catalog.mjs";

export const nativeDepthSchema = z.object({
  symbol: z.enum(["BTC", "ETH"]).describe("BTC or ETH only."),
  side: z.enum(["buy", "sell"]),
  quantity_base: z.string().max(96).regex(/^-?[0-9]+(?:\.[0-9]+)?$/).describe("Token base units, not USDC."),
  lookback_s: z.union([z.literal(30), z.literal(300)]).optional().describe("Optional wall lookback in seconds."),
  x_payment: z.string().max(100000).optional().describe("x402 Base or Solana payment. Omit first to discover 402."),
  agent_wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional().describe("Optional wallet for credits. Never a private key."),
}).strict();

function result(value, error = false) {
  return { content: [{ type: "text", text: JSON.stringify(value) }], structuredContent: value, ...(error ? { isError: true } : {}) };
}

export function registerNativeDepthTool(server, ctx) {
  const product = createDataProductX402({
    toolName: NATIVE_DEPTH_TOOL.name,
    description: NATIVE_DEPTH_TOOL.description,
    priceEnv: "LIQ_RADAR_X402_PRICE_USDC",
    payToEnv: "MIMO_SIGNAL_X402_PAYTO",
    internalPath: "/api/m2m/internal/native-depth",
    resourceUrl: ctx.resourceUrl,
  });
  server.registerTool(NATIVE_DEPTH_TOOL.name, {
    description: `${NATIVE_DEPTH_TOOL.description} Price: 0.001 USDC/call via existing x402 Base/Solana or eligible credits.`,
    inputSchema: nativeDepthSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  }, async (input, extra) => {
    if (!nativeDepthEnabled()) return result({ ok: false, error: "native_depth_disabled" }, true);
    if (!ctx.internalSecret) return result({ ok: false, error: "native_depth_unavailable" }, true);
    const { x_payment, agent_wallet, ...args } = input;
    let prepared;
    const beforeCharge = async () => {
      if (prepared) return;
      if (extra.signal?.aborted) throw new Error("cancelled");
      const response = ctx.prepare ? await ctx.prepare(args, extra.signal) : (await axios.post(
        `${ctx.m2mUrl.replace(/\/$/, "")}/api/m2m/internal/native-depth`,
        args,
        {
          headers: { "X-M2M-Internal-Secret": ctx.internalSecret },
          timeout: 8000,
          signal: extra.signal,
          maxBodyLength: 1024 * 1024,
          maxContentLength: 2 * 1024 * 1024,
          validateStatus: () => true,
        },
      )).data;
      if (extra.signal?.aborted) throw new Error("cancelled");
      if (response?.error === "unsupported_symbol" || response?.error === "invalid_request") {
        const err = new Error(response.error);
        err.code = response.error;
        throw err;
      }
      if (!response?.ok || response.product !== "hypernatt_native_depth_v1" || response.result?.ok !== true) {
        throw new Error(response?.error || "data_unavailable");
      }
      prepared = response;
    };
    try {
      const payment = await ctx.pay({
        tool: NATIVE_DEPTH_TOOL.name,
        priceUsdc: product.priceUsdc,
        symbol: args.symbol,
        paymentRaw: x_payment || ctx.sessionPayment?.(extra.sessionId),
        agent_wallet,
        sessionId: extra.sessionId,
        parse: product.parsePaymentHeader,
        verify: product.verifyPayment,
        buildRequired: product.buildPaymentRequired,
        buildRequirements: product.buildPaymentRequirements,
        beforeCharge,
      });
      if (payment.errorResult) return payment.errorResult;
      if (!payment.ok || !prepared) return result({ ok: false, error: "native_depth_not_prepared" }, true);
      try {
        ctx.record?.({ ...payment, wallet: payment.wallet, tool: NATIVE_DEPTH_TOOL.name, priceUsdc: product.priceUsdc, sessionId: extra.sessionId });
      } catch { /* telemetry never blocks */ }
      return result(prepared);
    } catch (error) {
      const code = error?.code || error?.message || "native_depth_unavailable";
      const http = error?.response?.status;
      if (http === 400 || code === "unsupported_symbol" || code === "invalid_request") {
        return result({ ok: false, error: code, message: "Native depth rejected this request. No payment was taken." }, true);
      }
      return result({ ok: false, error: code === "data_unavailable" ? "native_depth_unavailable" : code, message: "Native depth could not be prepared. No result was released." }, true);
    }
  });
}

import axios from 'axios';
import { z } from 'zod';
import { schemas } from './rd/execution-context/schemas.mjs';
import { createDataProductX402 } from './x402-data-products.mjs';
import { EXECUTION_CONTEXT_TOOLS, executionContextEnabled } from './execution-context-catalog.mjs';

export const executionSchemas = Object.fromEntries(EXECUTION_CONTEXT_TOOLS.map(({ operation }) => {
  let schema = schemas[operation];
  if (operation === 'reconcile') schema = schema.extend({ fills_dataset: schema.shape.fills_dataset.extend({ fills: schema.shape.fills_dataset.shape.fills.min(1) }) });
  return [operation, schema.extend({
    x_payment: z.string().max(100000).optional().describe('x402 Base or Solana payment, as for get_liq_radar. Omit first to discover access/payment requirements; 0.001 USDC per call.'),
    agent_wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional().describe('Optional wallet for existing pass/swap-credit access. Never a private key.'),
  }).strict()];
}));

function result(value, error = false) {
  return { content: [{ type: 'text', text: JSON.stringify(value) }], structuredContent: value, ...(error ? { isError: true } : {}) };
}

export function withDeliveryQuality(payload, now = Date.now()) {
  const quality = payload.result?.quality ?? payload.result?.after?.quality ?? payload.result?.baseline_quality;
  const bookTime = payload.baseline?.observation?.book?.time;
  const age = Number.isSafeInteger(bookTime) ? now - bookTime : null;
  return { ...payload, delivery: {
    delivered_at_ms: now, source_age_signed_ms: age,
    data_usable_at_delivery: Boolean(quality?.usable_now && quality.clock_status === 'synchronized' && quality.evaluation_mode === 'live' && age !== null && age >= -250 && age <= 5000),
    note: 'Data quality only, not order eligibility or a recommendation. Costs use the recorded snapshot; settlement can add delay.',
  } };
}

export function registerExecutionContextTools(server, ctx) {
  for (const { name, operation, description } of EXECUTION_CONTEXT_TOOLS) {
    const product = createDataProductX402({
      toolName: name, description, priceEnv: 'LIQ_RADAR_X402_PRICE_USDC',
      payToEnv: 'MIMO_SIGNAL_X402_PAYTO', internalPath: `/api/m2m/internal/execution-context/${operation}`,
    });
    server.registerTool(name, {
      description: `${description} Price: 0.001 USDC/call via existing x402 Base/Solana or eligible credits.`,
      inputSchema: executionSchemas[operation],
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    }, async (input, extra) => {
      if (!executionContextEnabled()) return result({ ok: false, error: 'execution_context_disabled' }, true);
      if (!ctx.internalSecret) return result({ ok: false, error: 'execution_context_unavailable' }, true);
      const { x_payment, agent_wallet, ...args } = input;
      if (Buffer.byteLength(JSON.stringify(args)) > 1024 * 1024) return result({ ok: false, error: 'input_too_large' }, true);
      let prepared;
      const beforeCharge = async () => {
        if (prepared) return;
        if (extra.signal?.aborted) throw new Error('cancelled');
        const response = ctx.prepare ? await ctx.prepare(operation, args, extra.signal) : (await axios.post(
          `${ctx.m2mUrl.replace(/\/$/, '')}/api/m2m/internal/execution-context/${operation}`, args,
          { headers: { 'X-M2M-Internal-Secret': ctx.internalSecret }, timeout: 28000, signal: extra.signal, maxBodyLength: 1024 * 1024, maxContentLength: 2 * 1024 * 1024 },
        )).data;
        if (extra.signal?.aborted) throw new Error('cancelled');
        if (!response?.ok || response.product !== 'hypernatt_execution_context_v1' || response.result?.ok !== true || response.result.schema_version !== 'hypernatt_execution_context_v1') throw new Error('preparation_failed');
        if (response.result?.status === 'unavailable' || response.result?.after?.status === 'unavailable') throw new Error('data_unavailable');
        prepared = response;
      };
      try {
        const payment = await ctx.pay({
          tool: name, priceUsdc: product.priceUsdc,
          symbol: operation === 'quote' ? args.symbol : args.baseline.request.symbol,
          paymentRaw: x_payment || ctx.sessionPayment?.(extra.sessionId), agent_wallet,
          sessionId: extra.sessionId, parse: product.parsePaymentHeader, verify: product.verifyPayment,
          buildRequired: product.buildPaymentRequired, buildRequirements: product.buildPaymentRequirements,
          beforeCharge,
        });
        if (payment.errorResult) return payment.errorResult;
        // Fail closed if a payment implementation accidentally omits preparation.
        if (!payment.ok || !prepared) return result({ ok: false, error: 'execution_context_not_prepared' }, true);
        // Accounting telemetry must not discard a paid, prepared result.
        try { ctx.record?.({ ...payment, wallet: payment.wallet, tool: name, priceUsdc: product.priceUsdc, sessionId: extra.sessionId }); } catch { /* best effort, same data response */ }
        return result(withDeliveryQuality(prepared));
      } catch (error) {
        const upstream = error?.response?.data;
        const code = typeof upstream?.error === 'string' ? upstream.error : ['cancelled', 'data_unavailable'].includes(error?.message) ? error.message : 'execution_context_unavailable';
        return result({ ok: false, error: code, message: 'Execution context could not be prepared. No result was released.' }, true);
      }
    });
  }
}

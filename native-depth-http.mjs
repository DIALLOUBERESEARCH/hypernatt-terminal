/** F377: HTTP facade of get_native_depth. Strict x402, no MCP envelope. */
import express from 'express';
import { registerNativeDepthTool, nativeDepthSchema } from './native-depth-public.mjs';
import { NATIVE_DEPTH_TOOL, nativeDepthEnabled, nativeDepthHttpPath } from './native-depth-catalog.mjs';
import { createDataProductX402 } from './x402-data-products.mjs';
import { isDeliverAfterSettleEnabled, isTerminalX402FunnelEnabled, settleTerminalPayment } from './x402-funnel-terminal.mjs';
import { isSettlementCacheEnabled } from './x402-settlement-cache.mjs';
import { hydrateSvmPaymentPayload } from './x402-svm-hydrate.mjs';
import { extractPayerWallet, recordX402Event } from './x402-telemetry.mjs';

const BASE = 'https://hypernatt.com';
const urlFor = () => BASE + nativeDepthHttpPath();
export const httpNativeDepthSchema = nativeDepthSchema.omit({ x_payment: true, agent_wallet: true });
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64');
const errorResult = value => ({ isError: true, structuredContent: value });

export function selectHttpPayment(raw, product) {
  const payment = product.parsePaymentHeader(raw);
  if (!payment || typeof payment !== 'object' || Array.isArray(payment) ||
      payment.x402Version !== 2 || 'receipt' in payment || !payment.payload ||
      typeof payment.payload !== 'object' || Array.isArray(payment.payload)) throw Error('invalid_payment');
  const requirement = product.buildPaymentRequired().accepts.find(r => r.network === payment.accepted?.network);
  if (!requirement) throw Error('unsupported_network');
  const hydrated = hydrateSvmPaymentPayload(payment, requirement);
  const accepted = hydrated.accepted;
  for (const field of ['scheme', 'network', 'asset', 'payTo']) {
    const fold = field === 'asset' || field === 'payTo';
    const normalize = value => fold && requirement.network.startsWith('eip155:') ? String(value).toLowerCase() : String(value);
    if (normalize(accepted?.[field]) !== normalize(requirement[field])) throw Error('payment_mismatch');
  }
  if (String(accepted.amount) !== String(requirement.amount ?? requirement.maxAmountRequired)) throw Error('amount_mismatch');
  if (payment.resource && (payment.resource.url ?? payment.resource) !== requirement.resource) throw Error('resource_mismatch');
  return { paymentPayload: hydrated, serverRequirements: requirement };
}

export function createNativeDepthHttpRouter(ctx, deps = {}) {
  const router = express.Router();
  const settle = deps.settle ?? settleTerminalPayment;
  const record = deps.record ?? recordX402Event;
  const event = value => { try { record({ transport: 'http', ...value }); } catch { /* telemetry never blocks delivery */ } };
  const ready = () => nativeDepthEnabled() && ctx.internalSecret &&
    isDeliverAfterSettleEnabled() && isTerminalX402FunnelEnabled() && isSettlementCacheEnabled();
  const { name, description } = NATIVE_DEPTH_TOOL;
  const product = createDataProductX402({
    toolName: name, description,
    priceEnv: 'LIQ_RADAR_X402_PRICE_USDC', payToEnv: 'MIMO_SIGNAL_X402_PAYTO',
    internalPath: '/api/m2m/internal/native-depth', resourceUrl: urlFor(),
  });
  const required = (error) => {
    const { mcp_hint: _hint, ...body } = product.buildPaymentRequired(error);
    return { ...body, resource: { url: urlFor(), description, mimeType: 'application/json' },
      accepts: body.accepts.map(r => ({ ...r, amount: String(r.amount ?? r.maxAmountRequired) })),
      instructions: 'POST the tool arguments as JSON with PAYMENT-SIGNATURE (or X-Payment). HTTP is pay-per-call; MCP trials and credits remain available through the MCP connection.' };
  };
  const challenge = (res, error) => {
    const body = required(error);
    res.set('PAYMENT-REQUIRED', encode(body));
    event({ event_type: '402_shown', tool: name, price_usdc: product.priceUsdc });
    return res.status(402).json(body);
  };
  router.all('/quote', (req, res, next) => {
    res.set('Cache-Control', 'private, no-store');
    if (!['POST', 'GET', 'HEAD'].includes(req.method)) return res.set('Allow', 'POST, GET, HEAD').status(405).json({ error: 'method_not_allowed' });
    if (!ready()) return res.status(503).json({ error: 'native_depth_unavailable' });
    const modern = req.get('PAYMENT-SIGNATURE'); const legacy = req.get('X-Payment');
    if (modern && legacy && modern !== legacy) return res.status(400).json({ error: 'conflicting_payment_headers' });
    const raw = modern || legacy;
    if (req.method !== 'POST' || !raw) return challenge(res);
    try { res.locals.httpPayment = selectHttpPayment(raw, product); }
    catch { return challenge(res, 'Invalid payment payload or payment requirements'); }
    next();
  }, express.json({ limit: '1mb' }), async (req, res) => {
    const parsed = httpNativeDepthSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'invalid_arguments', issues: parsed.error.issues.map(i => ({ path: i.path, code: i.code })) });
    const controller = new AbortController();
    const cancel = () => { if (!res.writableEnded) controller.abort(); };
    res.on('close', cancel);
    let callback; let receipt;
    registerNativeDepthTool({ registerTool: (toolName, _config, handler) => { if (toolName === name) callback = handler; } }, {
      ...ctx, resourceUrl: urlFor(),
      pay: async ({ beforeCharge }) => {
        if (!ready()) return { errorResult: errorResult({ error: 'native_depth_unavailable' }) };
        await beforeCharge();
        if (controller.signal.aborted) throw Error('cancelled');
        const { paymentPayload, serverRequirements } = res.locals.httpPayment;
        const settled = await settle({ paymentPayload, serverRequirements });
        if (!settled.ok) return { errorResult: errorResult(required('Payment rejected or already used')) };
        receipt = { success: true, transaction: settled.txHash ?? '', network: serverRequirements.network, payer: extractPayerWallet(paymentPayload) ?? '' };
        event({ event_type: 'payment_settled', tool: name, price_usdc: product.priceUsdc,
          network: receipt.network, payer_wallet: receipt.payer, tx_hash: settled.txHash ?? null });
        return { ok: true, wallet: receipt.payer };
      },
    });
    try {
      const out = await callback(parsed.data, { signal: controller.signal });
      if (controller.signal.aborted) return;
      const body = out.structuredContent;
      if (out.isError || !receipt) {
        if (body?.accepts) return challenge(res, body.error);
        const code = body?.error || 'native_depth_unavailable';
        const status = code === 'unsupported_symbol' || code === 'invalid_request' ? 400 : 503;
        return res.status(status).json({ ok: false, error: code });
      }
      res.set('PAYMENT-RESPONSE', encode(receipt));
      res.set('X-Payment-Response', encode(receipt));
      return res.json(body);
    } catch {
      if (!controller.signal.aborted) return res.status(503).json({ error: 'native_depth_unavailable' });
    } finally { res.off('close', cancel); }
  });
  router.use((_req, res) => res.status(404).json({ error: 'unknown_operation' }));
  router.use((error, _req, res, _next) => res.status(error.type === 'entity.too.large' ? 413 : 400).json({ error: error.type === 'entity.too.large' ? 'input_too_large' : 'invalid_json' }));
  return router;
}

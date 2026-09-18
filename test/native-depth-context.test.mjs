import test from 'node:test';
import assert from 'node:assert/strict';
import { assertNativeDepthPrepared, registerNativeDepthTool, withNativeDepthDelivery } from '../native-depth-public.mjs';

function prepared(now = Date.now()) {
  return { ok: true, product: 'hypernatt_native_depth_v1', result: {
    ok: true, source: 'recorder_REF', schema_version: 'hypernatt_native_depth_v2',
    feature_version: 'market_context_v2', not_a_signal: true,
    quality: { source_kind: 'recorded_market_data', evaluation_mode: 'live', stale: false, book_time_ms: now },
    liquidity_map: { views: ['REF', 'M2', 'M5', 'AGG4'].map(view => ({ view, book_time_ms: now })) },
  } };
}

test('freshness boundaries and recorded provenance are enforced', () => {
  const now = 1789714806000;
  for (const age of [-250, 0, 14999, 15000]) assert.doesNotThrow(() => assertNativeDepthPrepared(prepared(now - age), now));
  for (const age of [-251, 15001, 100000]) assert.throws(() => assertNativeDepthPrepared(prepared(now - age), now));
  for (const change of [
    x => { x.result.quality.source_kind = 'fixture'; },
    x => { x.result.quality.stale = true; },
    x => { x.result.quality.evaluation_mode = 'historical'; },
    x => { x.result.feature_version = 'native_depth_v1'; },
    x => { x.result.not_a_signal = false; },
    x => { x.result.liquidity_map.views[1].book_time_ms -= 1; },
    x => { x.result.liquidity_map.views.pop(); },
  ]) { const value = prepared(now); change(value); assert.throws(() => assertNativeDepthPrepared(value, now)); }
});

test('stale and legacy fixture responses cannot consume credit or settlement', async () => {
  for (const response of [prepared(Date.now() - 60000), { ok: true, product: 'hypernatt_native_depth_v1', result: { ok: true } }]) {
    let callback, charges = 0;
    registerNativeDepthTool({ registerTool(_name, _config, handler) { callback = handler; } }, {
      internalSecret: 'mock-internal', prepare: async () => response,
      pay: async ({ beforeCharge }) => { await beforeCharge(); charges++; return { ok: true }; },
    });
    const out = await callback({ symbol: 'ETH', side: 'buy', quantity_base: '1000' }, {});
    assert.equal(out.isError, true);
    assert.equal(charges, 0);
    assert.equal(out.structuredContent.result, undefined);
  }
});

test('fresh preparation is delivered; delayed settlement is labelled expired', async () => {
  let callback, charges = 0;
  registerNativeDepthTool({ registerTool(_name, _config, handler) { callback = handler; } }, {
    internalSecret: 'mock-internal', prepare: async () => prepared(),
    pay: async ({ beforeCharge }) => { await beforeCharge(); charges++; return { ok: true }; },
  });
  const out = await callback({ symbol: 'ETH', side: 'buy', quantity_base: '1000' }, {});
  assert.equal(out.isError, undefined);
  assert.equal(charges, 1);
  assert.equal(out.structuredContent.result.delivery.within_age_window, true);
  const before = prepared(1789714806000);
  const delayed = withNativeDepthDelivery(before, 1789714821001);
  assert.equal(delayed.result.quality.stale, true);
  assert.equal(delayed.result.quality.evaluation_mode, 'expired_after_payment');
  assert.equal(delayed.result.quality.book_time_ms, before.result.quality.book_time_ms);
  assert.equal(before.result.quality.stale, false);
});

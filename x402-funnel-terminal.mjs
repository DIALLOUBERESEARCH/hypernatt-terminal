/**
 * F85N / T1 — Terminal MCP: await settle + SettlementCache (F77N parity).
 */
import { settlePaymentWithFacilitator, verifyPaymentWithFacilitator } from "./x402-facilitator-client.mjs";
import {
  createSettlementCache,
  isSettlementCacheEnabled,
  paymentDigestFromPayload,
  settlementCacheTtlMsFromEnv,
} from "./x402-settlement-cache.mjs";

export function isDeliverAfterSettleEnabled(env = process.env) {
  const v = env.M2M_X402_DELIVER_AFTER_SETTLE_ENABLED;
  if (v === undefined || v === "") return true;
  return v === "true" || v === "1";
}

export function isTerminalX402FunnelEnabled(env = process.env) {
  const v = env.M2M_X402_FUNNEL_INTEGRITY_ENABLED;
  if (v === undefined || v === "") return true;
  return v === "true" || v === "1";
}

let sharedCache;

export function getSharedSettlementCache(env = process.env) {
  if (!isSettlementCacheEnabled(env)) return null;
  if (!sharedCache) {
    sharedCache = createSettlementCache({ ttlMs: settlementCacheTtlMsFromEnv(env) });
  }
  return sharedCache;
}

export function resetSharedSettlementCache() {
  sharedCache = undefined;
}

/**
 * Verify with server requirements, gate cache, await settle when enabled.
 * @returns {{ ok: true, txHash?: string|null } | { ok: false, error: string, reason?: string }}
 */
export async function settleTerminalPayment({
  paymentPayload,
  serverRequirements,
  cache = getSharedSettlementCache(),
  env = process.env,
}) {
  const verification = await verifyPaymentWithFacilitator(
    paymentPayload,
    serverRequirements,
  );
  if (!verification.isValid) {
    return {
      ok: false,
      error: verification.error || "Payment verification failed",
      reason: "payment_invalid",
    };
  }

  const digest = paymentDigestFromPayload(paymentPayload);
  if (cache) {
    const gate = cache.beginSettle(digest);
    if (!gate.allow) {
      return {
        ok: false,
        error:
          gate.reason === "payment_settlement_in_progress"
            ? "Payment settlement already in progress"
            : "This payment was already used",
        reason: gate.reason || "payment_already_used",
      };
    }
  }

  if (!isDeliverAfterSettleEnabled(env)) {
    settlePaymentWithFacilitator(paymentPayload, serverRequirements)
      .then((result) => {
        if (!cache) return;
        if (result.success) cache.completeSettle(digest, result.txHash);
        else cache.failSettle(digest);
      })
      .catch(() => {
        if (cache) cache.failSettle(digest);
      });
    return { ok: true, txHash: null };
  }

  const settled = await settlePaymentWithFacilitator(
    paymentPayload,
    serverRequirements,
  );
  if (!settled.success) {
    if (cache) cache.failSettle(digest);
    return {
      ok: false,
      error: settled.error || "On-chain settlement failed",
      reason: "settlement_failed",
    };
  }
  if (cache) cache.completeSettle(digest, settled.txHash);
  return { ok: true, txHash: settled.txHash ?? null };
}

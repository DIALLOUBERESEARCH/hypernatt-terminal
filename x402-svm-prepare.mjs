/**
 * F#204 — MCP: select rail (same law as HTTP selectRequirementForPayload)
 * then hydrate. Flag off = identity (caller keeps current CDP body).
 */

import { selectRequirementForPayload } from "./x402-networks.mjs";
import {
    hydrateSvmPaymentPayload,
    isSvmCompatEnabled,
} from "./x402-svm-hydrate.mjs";

export { isSvmCompatEnabled };

export function preparePaymentForCdp(paymentPayload, baseRequirement) {
    if (!isSvmCompatEnabled()) {
        return { payload: paymentPayload, serverReq: baseRequirement };
    }
    const serverReq = selectRequirementForPayload(
        paymentPayload,
        baseRequirement,
    );
    const payload = hydrateSvmPaymentPayload(paymentPayload, serverReq);
    return { payload, serverReq };
}

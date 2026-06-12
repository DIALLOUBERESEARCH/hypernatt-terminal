/**
 * F#38N — quota bypass precheck (mcp-server -> m2m-service).
 */
import axios from "axios";

const M2M_URL = process.env.M2M_SERVICE_URL || "http://m2m-service:8010";
const INTERNAL_SECRET =
    process.env.M2M_INTERNAL_SECRET ||
    process.env.NATTSQUARE_INTERNAL_SECRET ||
    "";

function normalizeWallet(wallet) {
    if (typeof wallet !== "string") return null;
    const w = wallet.trim().toLowerCase();
    return /^0x[a-f0-9]{40}$/.test(w) ? w : null;
}

/**
 * Debit quota and return true when Decision Core call is covered.
 */
export async function checkQuotaBypass(wallet, tool) {
    const w = normalizeWallet(wallet);
    if (!w || !INTERNAL_SECRET) return false;
    try {
        const res = await axios.post(
            `${M2M_URL.replace(/\/$/, "")}/api/m2m/internal/quota/precheck`,
            { wallet: w, tool },
            {
                headers: {
                    "X-M2M-Internal-Secret": INTERNAL_SECRET,
                    "Content-Type": "application/json",
                },
                timeout: 3000,
            },
        );
        return res.data?.bypass === true;
    } catch {
        return false;
    }
}

// F#377: public native depth catalog. BTC/ETH only. No public 20-level book.
export const NATIVE_DEPTH_PRICE_USDC = 0.001;
export const NATIVE_DEPTH_TOOL = {
  name: "get_native_depth",
  operation: "quote",
  description:
    "For a BTC or ETH Hyperliquid size, walk the operator-filmed native REF book (not the public 20-level vitrine). Reports filled, remaining, vitrine-cap counterfactual on the SAME snapshot, optional 30s/300s wall delta. Read-only; not a trade signal; no order.",
};
export const NATIVE_DEPTH_NAMES = [NATIVE_DEPTH_TOOL.name];
export const NATIVE_DEPTH_HTTP_PREFIX = "/api/m2m/native-depth";
export const nativeDepthHttpPath = () => `${NATIVE_DEPTH_HTTP_PREFIX}/quote`;
export const NATIVE_DEPTH_SYMBOLS = ["BTC", "ETH"];

export function nativeDepthEnabled(env = process.env) {
  return env.TERMINAL_NATIVE_DEPTH_ENABLED !== "false";
}

export function nativeDepthManifestTools() {
  return [
    {
      name: NATIVE_DEPTH_TOOL.name,
      role: NATIVE_DEPTH_TOOL.description,
      price: "0.001 USD (1 credit)",
      credit_cost: 1,
      symbols: [...NATIVE_DEPTH_SYMBOLS],
      transport: "MCP",
      endpoint: "https://hypernatt.com/mcp/protocol",
    },
  ];
}

// F312: shared by the public MCP and compact/full HTTP manifest.
export const EXECUTION_CONTEXT_PRICE_USDC = 0.001;
export const EXECUTION_CONTEXT_TOOLS = [
  { name: 'get_execution_quote', operation: 'quote', description: 'For a Hyperliquid perpetual order size, estimate visible depth, VWAP, spread and separate exchange/builder fees. Save the returned baseline for later comparison. BTC ETH SOL BNB XRP HYPE ZEC. Read-only; no order or fill guarantee.' },
  { name: 'compare_execution_context', operation: 'compare', description: 'Compare the SAME intended order with its previous baseline: net changes in visible liquidity, estimated costs and data quality. Returns the next baseline. Snapshot comparison, not a complete event stream.' },
  { name: 'reconcile_execution', operation: 'reconcile', description: 'Compare supplied fills for one Hyperliquid order with its pre-order baseline at observed quantity. Separate price and fee gaps; no invented latency cause. Caller-supplied data is unverified; no account fetch or order submission.' },
];
export const EXECUTION_CONTEXT_NAMES = EXECUTION_CONTEXT_TOOLS.map(tool => tool.name);
export function executionContextEnabled(env = process.env) {
  return env.TERMINAL_EXECUTION_CONTEXT_ENABLED !== 'false';
}
export function executionContextManifestTools() {
  return EXECUTION_CONTEXT_TOOLS.map(({ name, description }) => ({
    name, role: description, price: '0.001 USD (1 credit)', credit_cost: 1,
    symbols: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'HYPE', 'ZEC'],
    transport: 'MCP', endpoint: 'https://hypernatt.com/mcp/protocol',
  }));
}

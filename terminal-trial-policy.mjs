/** F318: bounded public intro identity; independent of settlement and pricing. */
export const TRIAL_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'HYPE', 'ZEC'];
export const TRIAL_TOOLS = ['get_liq_radar', 'get_execution_quote', 'compare_execution_context', 'reconcile_execution'];
export const perSymbolIntroEnabled = () => process.env.X402_TOOL_INTRO_PER_SYMBOL_ENABLED !== 'false';

export function trialSymbol(tool, value) {
  if (tool === 'get_liq_radar' && value === undefined) return 'BTC';
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return TRIAL_SYMBOLS.includes(normalized) ? normalized : null;
}

export function trialStorageKey(tool, symbol) {
  if (!TRIAL_TOOLS.includes(tool) || !perSymbolIntroEnabled()) return tool;
  const coin = trialSymbol(tool, symbol);
  return coin ? `v2:${tool}:${coin}` : null;
}

export function terminalTrialPolicy() {
  const enabled = process.env.X402_TOOL_INTRO_FREE_ENABLED !== 'false';
  return {
    version: '2', enabled,
    scope: perSymbolIntroEnabled() ? 'per_client_per_tool_per_symbol_per_utc_day' : 'per_client_per_tool_per_utc_day',
    calls_per_slot: 1, tools: [...TRIAL_TOOLS], symbols: [...TRIAL_SYMBOLS],
    maximum_daily_intro_calls: enabled ? (perSymbolIntroEnabled() ? 28 : 4) : 0,
    price_after_intro_usdc: '0.001', reset: '00:00 UTC',
    note: 'Choose your token before calling. BTC default applies only to omitted radar symbol. compare/reconcile use baseline.request.symbol. Intro slots are independent; daily_cap describes the separate credit pool. Same MCP client identity is required to read your remaining slots.',
  };
}

export function terminalTrialSummary() {
  const policy = terminalTrialPolicy();
  if (!policy.enabled) return 'Intro trials are disabled. ';
  return perSymbolIntroEnabled()
    ? 'One free call per paid tool and per token per client each UTC day: 4 tools x 7 tokens, up to 28 independent trials. '
    : 'One free call per paid tool per client each UTC day; tokens share that tool trial. ';
}

/** F318/F377: bounded public intro identity; independent of settlement and pricing. */
export const TRIAL_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'HYPE', 'ZEC'];
export const NATIVE_TRIAL_SYMBOLS = ['BTC', 'ETH'];
export const TRIAL_TOOLS = ['get_liq_radar', 'get_native_depth'];
export const perSymbolIntroEnabled = () => process.env.X402_TOOL_INTRO_PER_SYMBOL_ENABLED !== 'false';

export function trialSymbolsForTool(tool) {
  return tool === 'get_native_depth' ? [...NATIVE_TRIAL_SYMBOLS] : [...TRIAL_SYMBOLS];
}

export function trialSymbol(tool, value) {
  if (tool === 'get_liq_radar' && value === undefined) return 'BTC';
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return trialSymbolsForTool(tool).includes(normalized) ? normalized : null;
}

export function trialStorageKey(tool, symbol) {
  if (!TRIAL_TOOLS.includes(tool) || !perSymbolIntroEnabled()) return tool;
  const coin = trialSymbol(tool, symbol);
  return coin ? `v2:${tool}:${coin}` : null;
}

export function terminalTrialPolicy() {
  const enabled = process.env.X402_TOOL_INTRO_FREE_ENABLED !== 'false';
  const maxSlots = TRIAL_TOOLS.reduce((n, tool) => n + trialSymbolsForTool(tool).length, 0);
  return {
    version: '2', enabled,
    scope: perSymbolIntroEnabled() ? 'per_client_per_tool_per_symbol_per_utc_day' : 'per_client_per_tool_per_utc_day',
    calls_per_slot: 1, tools: [...TRIAL_TOOLS], symbols: [...TRIAL_SYMBOLS],
    native_symbols: [...NATIVE_TRIAL_SYMBOLS],
    maximum_daily_intro_calls: enabled ? (perSymbolIntroEnabled() ? maxSlots : TRIAL_TOOLS.length) : 0,
    price_after_intro_usdc: '0.001', reset: '00:00 UTC',
    note: 'Radar: one free call per token (7). Native depth: BTC and ETH only (2). Up to 9 independent trials per UTC day. BTC default applies only to omitted radar symbol. Intro slots are independent; daily_cap describes the separate credit pool, not the intro allowance. Same MCP client identity is required to read your remaining slots.',
  };
}

export function terminalTrialSummary() {
  const policy = terminalTrialPolicy();
  if (!policy.enabled) return 'Intro trials are disabled. ';
  return perSymbolIntroEnabled()
    ? 'One free call per paid tool and eligible token per client each UTC day: radar x 7 tokens plus native BTC/ETH, up to 9 independent trials. '
    : 'One free call per paid tool per client each UTC day; tokens share that tool trial. ';
}

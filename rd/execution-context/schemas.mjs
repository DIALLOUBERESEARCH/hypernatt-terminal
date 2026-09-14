import { z } from 'zod';

export const SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'HYPE', 'ZEC'];
const symbol = z.enum(SYMBOLS);
const decimal = z.string().max(96).regex(/^-?[0-9]+(?:\.[0-9]+)?$/).describe('Plain decimal string, never a float or exponent; core validates magnitude/precision.');
const timestamp = z.number().int().positive().max(Number.MAX_SAFE_INTEGER).describe('UTC Unix milliseconds.');
const clock = z.enum(['unknown', 'unsynchronized', 'synchronized']);
const fee = z.object({
  source: z.enum(['unknown', 'caller_assumption', 'account_rate_supplied']),
  rate: decimal.nullable().optional().describe('Fraction of notional: 0.00045 means 4.5bps. Unknown is not zero.'),
  as_of_ms: timestamp.nullable().optional(),
}).strict();
const order = {
  symbol, side: z.enum(['buy', 'sell']),
  quantity_base: decimal.describe('Requested quantity in token base units, NOT USDC notional; must match native szDecimals.'),
  limit_price: decimal.nullable().optional().describe('Optional hypothetical price cap; never submits an order.'),
  request_id: z.string().min(1).max(128).optional(),
  exchange_fee: fee.optional(), builder_fee: fee.optional(),
};
const level = z.object({ px: decimal, sz: decimal, n: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER) }).strict();
const identity = {
  schema_version: z.literal('hypernatt_execution_context_v1'),
  network: z.literal('mainnet'), venue: z.literal('hyperliquid'), market: z.literal('perpetual'),
};
export const observation = z.object({
  ...identity, precision: z.literal('native'),
  evaluation_mode: z.enum(['live', 'historical']),
  metadata: z.object({ universe: z.array(z.object({
    name: z.string(), szDecimals: z.number().int().min(0).max(6), isDelisted: z.boolean().optional(),
  }).passthrough()) }).passthrough(),
  metadata_received_at_ms: timestamp, request_at_ms: timestamp, received_at_ms: timestamp,
  evaluated_at_ms: timestamp, measured_rtt_ms: z.number().int().min(0).max(10000),
  clock_status: clock, clock_evidence: z.string().max(512).nullable().optional(),
  book: z.object({ coin: symbol, time: timestamp, levels: z.tuple([z.array(level).max(20), z.array(level).max(20)]) }).strict(),
}).strict().describe('Optional replay observation from F310. Caller-supplied values are ALWAYS evaluated historically, never trusted as live. Omit to fetch public meta+l2Book.');
export const baseline = z.object({
  request: z.object({ ...order, ...identity, mode: z.literal('taker_sweep'), request_id: z.string().min(1).max(128) }).strict(),
  observation,
}).strict().describe('Exact baseline object from a prior quote/compare result; retain it client-side. Caller-owned and unsigned, no server session.');
const identifier = z.union([z.string().regex(/^[0-9]{1,20}$/), z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)]);
export const fillsDataset = z.object({
  provenance: z.literal('caller_supplied'), completeness: z.enum(['unknown', 'caller_asserted']),
  account: z.string().regex(/^0x[0-9a-fA-F]{40}$/).describe('Trading account address only, never a key. Not verified or queried.'),
  order_id: identifier,
  fills: z.array(z.object({
    coin: symbol, oid: identifier, tid: identifier, side: z.enum(['B', 'A']), time: timestamp,
    px: decimal, sz: decimal, fee: decimal, feeToken: z.string().min(1).max(32),
    builderFee: decimal.nullable().optional(),
  }).passthrough()).max(2000),
  client_timing: z.object({
    clock_status: clock, clock_evidence: z.string().max(512).optional(),
    sent_at_ms: timestamp.nullable().optional(), ack_at_ms: timestamp.nullable().optional(),
  }).strict().optional(),
}).strict().describe('One order, user-provided native fills. fee already includes builderFee; completeness and account are not independently verified.');
export const schemas = {
  quote: z.object({ ...order, observation: observation.optional() }).strict(),
  compare: z.object({ baseline, observation: observation.optional() }).strict(),
  reconcile: z.object({ baseline, fills_dataset: fillsDataset }).strict(),
};

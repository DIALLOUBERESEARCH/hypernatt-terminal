#!/usr/bin/env node
/**
 * HyperNatt — CDP EVM wallet + MCP swap quote (optional execute on Base).
 *
 * Run on VPS with CDP keys in ~/HYPERNATT/.env:
 *   cd examples && npm install && node cdp_swap_execute.mjs --dry-run
 *   node cdp_swap_execute.mjs --execute   # needs USDC + ETH on Base mainnet
 *
 * Env: CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET
 * Optional: HYPERNATT_CDP_EVM_NAME (default hypernatt-swap-agent)
 */
import { CdpClient } from "@coinbase/cdp-sdk";

const MCP_URL = (process.env.HYPERNATT_MCP_URL || "https://hypernatt.com/mcp/protocol").replace(
  /\/$/,
  "",
);
const CDP_NAME = process.env.HYPERNATT_CDP_EVM_NAME || "hypernatt-swap-agent";
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const WETH_BASE = "0x4200000000000000000000000000000000000006";
const FROM_AMOUNT = process.env.SWAP_FROM_AMOUNT || "1000000";

const execute = process.argv.includes("--execute");
const dryRun = process.argv.includes("--dry-run") || !execute;

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} required (VPS ~/HYPERNATT/.env)`);
  return v;
}

async function mcpPost(payload, sessionId) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    "User-Agent": "hypernatt-cdp-swap/1.0",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const body = await res.text();
  return { status: res.status, body, sessionId: res.headers.get("mcp-session-id") };
}

function parseSse(body) {
  for (const line of body.split("\n")) {
    if (line.startsWith("data: ")) return JSON.parse(line.slice(6));
  }
  return JSON.parse(body);
}

async function initMcp() {
  const { status, body, sessionId } = await mcpPost({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "hypernatt-cdp-swap", version: "1.0" },
    },
  });
  if (status !== 200 || !sessionId) throw new Error(`MCP init ${status}: ${body.slice(0, 200)}`);
  await mcpPost({ jsonrpc: "2.0", method: "notifications/initialized" }, sessionId);
  return sessionId;
}

async function callTool(sid, name, args = {}) {
  const { status, body } = await mcpPost(
    {
      jsonrpc: "2.0",
      id: Date.now() % 1e6,
      method: "tools/call",
      params: { name, arguments: args },
    },
    sid,
  );
  const parsed = parseSse(body);
  const text = parsed?.result?.content?.[0]?.text ?? body;
  return { status, text, parsed };
}

async function main() {
  const cdp = new CdpClient({
    apiKeyId: requireEnv("CDP_API_KEY_ID"),
    apiKeySecret: requireEnv("CDP_API_KEY_SECRET"),
    walletSecret: requireEnv("CDP_WALLET_SECRET"),
  });

  const account = await cdp.evm.getOrCreateAccount({ name: CDP_NAME });
  const address = account.address;
  console.log(`[cdp] EVM account ${CDP_NAME}: ${address}`);

  const sid = await initMcp();
  await callTool(sid, "get_mm_trap_state");
  await callTool(sid, "get_btc_usdc_signal");

  const swapArgs = {
    fromChain: 8453,
    toChain: 8453,
    fromToken: USDC_BASE,
    toToken: WETH_BASE,
    fromAmount: FROM_AMOUNT,
    fromAddress: address,
    toAddress: address,
  };

  const { status, text } = await callTool(sid, "swap_via_nattswap", swapArgs);
  console.log(`[mcp] swap_via_nattswap status=${status}`);
  let outer;
  try {
    outer = JSON.parse(text);
  } catch {
    console.log(text.slice(0, 500));
    process.exit(1);
  }
  const data = outer.data || outer;
  const readiness = data.execution_readiness || {};
  console.log("[readiness]", JSON.stringify(readiness, null, 2));

  if (!readiness.can_execute) {
    console.log("[stop] can_execute=false — fix blockers before --execute");
    process.exit(dryRun ? 0 : 1);
  }

  const txReq = data.transactionRequest || data.route?.transactionRequest;
  if (!txReq) {
    console.log("[stop] no transactionRequest in quote");
    process.exit(1);
  }

  if (dryRun) {
    console.log("[dry-run] would broadcast transactionRequest on Base");
    console.log(JSON.stringify(txReq, null, 2).slice(0, 800));
    return;
  }

  console.log("[execute] sending via CDP evm.sendTransaction on base...");
  const { transactionHash } = await cdp.evm.sendTransaction({
    address,
    network: "base",
    transaction: {
      to: txReq.to,
      data: txReq.data,
      value: txReq.value ? BigInt(txReq.value) : 0n,
    },
  });
  console.log(`[tx] ${transactionHash}`);
  console.log(`[register] POST /api/m2m/swap/register agentAddress=${address} txHash=${transactionHash}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

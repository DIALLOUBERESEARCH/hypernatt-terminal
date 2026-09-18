import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerExecutionContextTools, withDeliveryQuality } from '../execution-context-public.mjs';
import { EXECUTION_CONTEXT_NAMES } from '../execution-context-catalog.mjs';
import { createMcpServer, mountMcpSignalRoutes } from '../mcp-signal-server.mjs';

test('info discovery advertises the same six tools and daily intro policy',()=>{
  const routes=new Map();
  const app={get:(path,handler)=>routes.set(path,handler),post:()=>{},all:()=>{}};
  mountMcpSignalRoutes(app);
  let info; routes.get('/signal/info')({}, {json:(value)=>{info=value;}});
  assert.equal(info.tools.length,6);
  for(const name of EXECUTION_CONTEXT_NAMES) assert.ok(info.tools.includes(name));
  assert.equal(info.trial_policy_v2.maximum_daily_intro_calls,28);
});

test('production MCP factory exposes exactly the six advertised tools',async()=>{
  const server=createMcpServer();const client=new Client({name:'factory-test',version:'1'});
  const [a,b]=InMemoryTransport.createLinkedPair();
  try {
    await server.connect(b);await client.connect(a);
    const {tools}=await client.listTools();
    assert.deepEqual(tools.map(t=>t.name).sort(),['get_agent_manifest','get_liq_radar','swap_via_nattswap',...EXECUTION_CONTEXT_NAMES].sort());
    const symbols=['BTC','ETH','SOL','BNB','XRP','HYPE','ZEC'];
    assert.deepEqual(tools.find(t=>t.name==='get_liq_radar').inputSchema.properties.symbol.enum,symbols);
    const card=JSON.parse(fs.readFileSync(new URL('../server-card.json',import.meta.url),'utf8'));
    assert.deepEqual(card.tools.find(t=>t.name==='get_liq_radar').inputSchema.properties.symbol.enum,symbols);
    const invalid=await client.callTool({name:'get_liq_radar',arguments:{symbol:'DOGE'}});
    assert.equal(invalid.isError,true);
  } finally {await client.close();await server.close();}
});

test('public mirror contains all six tool schemas and three execution registrations',async()=>{
  const server=new McpServer({name:'mirror-test',version:'1'});
  registerExecutionContextTools(server,{});
  const client=new Client({name:'test',version:'1'});
  const [a,b]=InMemoryTransport.createLinkedPair();
  try {
    await server.connect(b);await client.connect(a);
    const {tools}=await client.listTools();
    assert.deepEqual(tools.map(t=>t.name),EXECUTION_CONTEXT_NAMES);
    const card=JSON.parse(fs.readFileSync(new URL('../server-card.json',import.meta.url),'utf8'));
    assert.equal(card.tools.length,6);
    for(const t of tools) assert.deepEqual(card.tools.find(c=>c.name===t.name).inputSchema,t.inputSchema);
  } finally {await client.close();await server.close();}
});
test('public delivery time preserves source and never promotes an unknown clock',()=>{
  const time=1789394000000;
  for(const age of [0,4999,5000,5001,30000]) for(const clock of ['unknown','synchronized']) {
    const original={baseline:{observation:{book:{time}}},result:{quality:{usable_now:true,evaluation_mode:'live',clock_status:clock}}};
    const out=withDeliveryQuality(original,time+age);
    assert.equal(out.delivery.data_usable_at_delivery,clock==='synchronized'&&age<=5000);
    assert.equal(out.baseline.observation.book.time,time);
  }
});

test('F376 summary separates indicative age, clock proof, replay, coverage and fees',()=>{
  const time=1789394000000;
  const base={baseline:{observation:{book:{time}}},result:{phase:'before',quality:{usable_now:false,evaluation_mode:'live',clock_status:'unknown',limitations:[]},estimate:{full_order_vwap:'102',full_size_estimate:true},fee_status:{status:'partial',total_unavailable_reason:'missing_builder_fee'}}};
  for(const age of [-251,-250,500,5000,5001]) {
    const out=withDeliveryQuality(base,time+age);
    assert.equal(out.agent_readout.within_max_age,age>=-250&&age<=5000);
    assert.equal(out.agent_readout.snapshot_status,age>=-250&&age<=5000?'recent_clock_unattested':'outside_age_window');
    assert.equal(out.agent_readout.clock_attested,false);
    assert.equal(out.delivery.data_usable_at_delivery,false);
    assert.equal(Object.keys(out)[0],'agent_readout');
    assert.ok(out.agent_readout.warnings.includes('missing_builder_fee'));
  }
  const partial=structuredClone(base); partial.result.estimate.full_size_estimate=false;partial.result.estimate.full_order_vwap=null;
  assert.ok(withDeliveryQuality(partial,time).agent_readout.warnings.includes('requested_size_not_fully_covered'));
  const replay=structuredClone(base);replay.result.quality.evaluation_mode='historical';
  assert.equal(withDeliveryQuality(replay,time).agent_readout.snapshot_status,'historical');
  const bad=structuredClone(base);bad.result.quality.limitations=['metadata_stale'];
  assert.equal(withDeliveryQuality(bad,time).agent_readout.snapshot_status,'unavailable');
  assert.equal(withDeliveryQuality({},time).agent_readout.within_max_age,false);
  const comparison={...base,result:{phase:'during',after:base.result,fixed_anchor_bands:[{bid_complete_both:false,ask_complete_both:true}]}};
  assert.equal(withDeliveryQuality(comparison,time).agent_readout.full_order_vwap,'102');
  assert.ok(withDeliveryQuality(comparison,time).agent_readout.warnings.includes('incomplete_band_deltas_unavailable'));
  const reconciled={result:{phase:'after',baseline_quality:replay.result.quality,fee_status:{status:'complete'},comparison_status:'comparable_observed_quantity'}};
  assert.equal(withDeliveryQuality(reconciled,time).agent_readout.snapshot_status,'historical');
});

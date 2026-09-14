import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerExecutionContextTools, withDeliveryQuality } from '../execution-context-public.mjs';
import { EXECUTION_CONTEXT_NAMES } from '../execution-context-catalog.mjs';
import { createMcpServer } from '../mcp-signal-server.mjs';

test('production MCP factory exposes exactly the six advertised tools',async()=>{
  const server=createMcpServer();const client=new Client({name:'factory-test',version:'1'});
  const [a,b]=InMemoryTransport.createLinkedPair();
  try {
    await server.connect(b);await client.connect(a);
    const {tools}=await client.listTools();
    assert.deepEqual(tools.map(t=>t.name).sort(),['get_agent_manifest','get_liq_radar','swap_via_nattswap',...EXECUTION_CONTEXT_NAMES].sort());
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

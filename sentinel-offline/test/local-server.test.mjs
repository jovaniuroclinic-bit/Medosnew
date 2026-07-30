import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

test("servidor enlaza solo loopback, sirve PWA y protege mutaciones",async()=>{
  process.env.MEDOS_SENTINEL_DATA_DIR=mkdtempSync(join(tmpdir(),"sentinel-server-"));
  const {startLocalServer}=await import(`../build/localServer.js?test=${Date.now()}`);
  const server=startLocalServer(0);
  await new Promise(resolve=>server.once("listening",resolve));
  try{
    const address=server.address();assert.equal(typeof address,"object");assert.equal(address.address,"127.0.0.1");
    const base=`http://127.0.0.1:${address.port}`;
    const page=await fetch(base);assert.equal(page.status,200);assert.match(await page.text(),/Sentinel One/u);
    const stateResponse=await fetch(`${base}/api/state`);const state=await stateResponse.json();
    assert.equal(state.network,false);assert.equal(state.model,false);
    const rejected=await fetch(`${base}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:'{"message":"continuar"}'});
    assert.equal(rejected.status,403);
    assert.equal("csrf" in state,false);
    const accepted=await fetch(base+"/api/chat",{method:"POST",headers:{"Content-Type":"application/json","X-Sentinel-Intent":"local-ui","Origin":base},body:'{"message":"continuar"}'});
    assert.equal(accepted.status,200);assert.equal((await accepted.json()).status,"AHORA");
  }finally{await new Promise(resolve=>server.close(resolve));}
});

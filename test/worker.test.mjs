import assert from "node:assert/strict";
import test from "node:test";

const worker = (await import("../src/worker/index.ts")).default;

const assetsResponse = new Response("asset", { headers: { "content-type": "text/plain" } });
const env = { ASSETS: { fetch: async () => assetsResponse.clone() } };

test("GET /api/health returns service status", async () => {
  const response = await worker.fetch(new Request("https://medos.test/api/health"), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: "medos-uroclinic-web-preview" });
});

test("non-API requests use the ASSETS binding", async () => {
  const response = await worker.fetch(new Request("https://medos.test/servicios"), env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "asset");
});

test("appointment rejects unsupported methods", async () => {
  const response = await worker.fetch(new Request("https://medos.test/api/appointment"), env);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "POST");
});

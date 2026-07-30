import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/worker/index.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const worker = (await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)).default;

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

test("intake rejects unsupported methods", async () => {
  const response = await worker.fetch(new Request("https://medos.test/api/intake"), env);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "POST");
});

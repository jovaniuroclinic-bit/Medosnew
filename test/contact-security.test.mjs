import assert from "node:assert/strict";
import test from "node:test";
import { handleForm, resetFormSecurityForTests } from "../src/worker/forms.ts";

const now = Date.now();
const base = { name: "Prueba técnica MEDOS", phone: "8710000000", email: "", serviceCategory: "Prueba técnica del sistema", consent: true, honeypot: "", submissionStartedAt: now - 5_000, turnstileToken: "synthetic-token" };
const request = (payload, options = {}) => new Request("https://drjovaniurologo.org/api/appointment", {
  method: options.method ?? "POST",
  headers: { "content-type": "application/json", origin: "https://drjovaniurologo.org", "user-agent": "MEDOS-security-test", ...options.headers },
  body: options.method && options.method !== "POST" ? undefined : (options.raw ?? JSON.stringify(payload)),
});
const workingEnv = (send = async () => {}) => ({ TURNSTILE_SECRET_KEY: "turnstile-test", FORM_HMAC_SECRET: "hmac-test-only", MAIL_FROM: "notificaciones@drjovaniurologo.org", MAIL_TO_CITAS: "clinic-destination@example.test", MAIL_REPLY_TO: "citas@drjovaniurologo.org", EMAIL: { send } });
const allowTurnstile = () => {
  globalThis.fetch = async () => Response.json({ success: true, hostname: "drjovaniurologo.org" });
};
globalThis.EmailMessage = class { constructor(from, to, raw) { this.from = from; this.to = to; this.raw = raw; } };

test("restringe método, origen, Content-Type, JSON y tamaño", async () => {
  resetFormSecurityForTests();
  assert.equal((await handleForm(request(base, { method: "GET" }), {}, "appointment", now)).status, 405);
  assert.equal((await handleForm(request(base, { method: "PUT" }), {}, "appointment", now)).status, 405);
  assert.equal((await handleForm(request(base, { headers: { origin: "https://attacker.test" } }), {}, "appointment", now)).status, 403);
  assert.equal((await handleForm(request(base, { headers: { "content-type": "text/plain" } }), {}, "appointment", now)).status, 415);
  assert.equal((await handleForm(request(base, { raw: "{" }), {}, "appointment", now)).status, 400);
  assert.equal((await handleForm(request({ ...base, name: "x".repeat(17_000) }, { headers: { "content-length": "17000" } }), {}, "appointment", now)).status, 413);
});

test("rechaza campos extra, consentimiento, contactos, CRLF y XSS", async () => {
  resetFormSecurityForTests();
  for (const payload of [
    { ...base, clinicalAnswers: [1] },
    { ...base, consent: false },
    { ...base, phone: "123" },
    { ...base, email: "bad@" },
    { ...base, name: "Injected\r\nBcc: victim@test" },
  ]) assert.equal((await handleForm(request(payload), {}, "appointment", now)).status, 400);
  allowTurnstile();
  assert.equal((await handleForm(request({ ...base, serviceCategory: "<script>alert(1)</script>" }), workingEnv(), "appointment", now)).status, 400);
});

test("honeypot filtra silenciosamente y tiempo mínimo rechaza", async () => {
  resetFormSecurityForTests();
  assert.equal((await handleForm(request({ ...base, honeypot: "bot" }), {}, "appointment", now)).status, 202);
  assert.equal((await handleForm(request({ ...base, submissionStartedAt: now - 100 }), {}, "appointment", now)).status, 400);
});

test("Turnstile es fail-closed y valida hostname", async () => {
  resetFormSecurityForTests();
  assert.equal((await handleForm(request(base), { FORM_HMAC_SECRET: "x" }, "appointment", now)).status, 503);
  assert.equal((await handleForm(request({ ...base, turnstileToken: "" }), workingEnv(), "appointment", now)).status, 403);
  globalThis.fetch = async () => Response.json({ success: true, hostname: "attacker.test" });
  assert.equal((await handleForm(request(base), workingEnv(), "appointment", now)).status, 403);
});

test("envío válido, replay e idempotencia", async () => {
  resetFormSecurityForTests();
  allowTurnstile();
  const first = await handleForm(request(base, { headers: { "idempotency-key": "synthetic-1" } }), workingEnv(), "appointment", now);
  assert.equal(first.status, 202);
  assert.match((await first.json()).requestId, /^medos-[0-9a-f-]{36}$/);
  assert.equal((await handleForm(request(base, { headers: { "idempotency-key": "synthetic-1" } }), workingEnv(), "appointment", now)).status, 409);
});

test("rate limiting devuelve 429 y Retry-After", async () => {
  resetFormSecurityForTests();
  allowTurnstile();
  for (let index = 0; index < 5; index += 1) {
    const payload = { ...base, submissionStartedAt: base.submissionStartedAt - index - 1 };
    assert.equal((await handleForm(request(payload), workingEnv(), "appointment", now)).status, 202);
  }
  const limited = await handleForm(request({ ...base, submissionStartedAt: base.submissionStartedAt - 20 }), workingEnv(), "appointment", now);
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("retry-after"), "600");
});

test("fallo de correo es genérico y no filtra secretos", async () => {
  resetFormSecurityForTests();
  allowTurnstile();
  const result = await handleForm(request(base), workingEnv(async () => { throw new Error("private-provider-detail"); }), "appointment", now);
  assert.equal(result.status, 503);
  const body = await result.text();
  assert.doesNotMatch(body, /private-provider-detail|turnstile-test|hmac-test-only/);
});

test("contacto rechaza HTML y exceso de URLs", async () => {
  resetFormSecurityForTests();
  allowTurnstile();
  const contact = { name: base.name, phone: base.phone, email: "", subjectCategory: "General", message: "<b>html</b>", consent: true, honeypot: "", submissionStartedAt: base.submissionStartedAt, turnstileToken: base.turnstileToken };
  assert.equal((await handleForm(new Request("https://drjovaniurologo.org/api/contact", { method: "POST", headers: { "content-type": "application/json", origin: "https://drjovaniurologo.org", "user-agent": "MEDOS-security-test" }, body: JSON.stringify(contact) }), workingEnv(), "contact", now)).status, 400);
});

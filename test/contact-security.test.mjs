import assert from "node:assert/strict";
import test from "node:test";
import { handleForm } from "../src/worker/forms.ts";

const now = Date.now();
const base = { name: "Prueba técnica MEDOS", phone: "8710000000", email: "", serviceCategory: "Prueba del sistema", consent: true, honeypot: "", submissionStartedAt: now - 5_000 };
const request = (payload, headers = { "content-type": "application/json" }) =>
  new Request("https://drjovaniurologo.org/api/appointment", { method: "POST", headers, body: JSON.stringify(payload) });

test("rechaza Content-Type incorrecto y payload excesivo", async () => {
  assert.equal((await handleForm(request(base, { "content-type": "text/plain" }), {}, "appointment", now)).status, 415);
  assert.equal((await handleForm(request({ ...base, name: "x".repeat(17_000) }, { "content-type": "application/json", "content-length": "17000" }), {}, "appointment", now)).status, 413);
});

test("filtra honeypot y rechaza envío demasiado rápido", async () => {
  assert.equal((await handleForm(request({ ...base, honeypot: "bot" }), {}, "appointment", now)).status, 202);
  assert.equal((await handleForm(request({ ...base, submissionStartedAt: now - 100 }), {}, "appointment", now)).status, 422);
});

test("rechaza campos desconocidos, consentimiento y contactos inválidos", async () => {
  assert.equal((await handleForm(request({ ...base, clinicalAnswers: [1, 2] }), {}, "appointment", now)).status, 422);
  assert.equal((await handleForm(request({ ...base, consent: false }), {}, "appointment", now)).status, 422);
  assert.equal((await handleForm(request({ ...base, phone: "123" }), {}, "appointment", now)).status, 422);
  assert.equal((await handleForm(request({ ...base, email: "bad@" }), {}, "appointment", now)).status, 422);
});

test("rechaza HTML y URLs repetitivas sin filtrar secretos", async () => {
  const contact = { name: base.name, phone: base.phone, email: "", subjectCategory: "General", message: "<script>alert(1)</script>", consent: true, honeypot: "", submissionStartedAt: base.submissionStartedAt };
  assert.equal((await handleForm(request(contact), {}, "contact", now)).status, 422);
  assert.equal((await handleForm(request({ ...contact, message: "https://a.test https://b.test" }), {}, "contact", now)).status, 422);
  const unavailable = await handleForm(request(base), { MAIL_FROM: "x@test", MAIL_TO_CITAS: "y@test", FORM_HMAC_SECRET: "never-leak-this" }, "appointment", now);
  assert.doesNotMatch(await unavailable.text(), /never-leak-this/);
});

test("prioriza correo de clínica aunque falle confirmación", async () => {
  let calls = 0;
  globalThis.EmailMessage = class { constructor(from, to, raw) { this.from = from; this.to = to; this.raw = raw; } };
  const env = {
    MAIL_FROM: "notificaciones@drjovaniurologo.org",
    MAIL_TO_CITAS: "citas@drjovaniurologo.org",
    MAIL_REPLY_TO: "contacto@drjovaniurologo.org",
    EMAIL: { send: async () => { calls += 1; if (calls === 2) throw new Error("confirmation_failed"); } },
  };
  const result = await handleForm(request({ ...base, email: "synthetic@example.test" }), env, "appointment", now);
  assert.equal(result.status, 202);
  assert.equal((await result.json()).confirmation, "failed");
});

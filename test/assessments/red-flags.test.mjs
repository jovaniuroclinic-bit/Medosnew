import assert from "node:assert/strict";
import test from "node:test";
import { hasRedFlag, RED_FLAGS } from "../../src/lib/assessments/redFlags.ts";
import { assessmentWhatsAppHref } from "../../src/lib/assessments/whatsapp.ts";

test("incluye todas las banderas rojas requeridas", () => {
  assert.equal(RED_FLAGS.length, 9);
  for (const id of ["retention", "hematuria", "testicular", "fever", "severePain", "priapism", "neurologic", "cardiovascular", "selfHarm"]) {
    assert.ok(RED_FLAGS.some((flag) => flag.id === id));
  }
  assert.equal(hasRedFlag({}), false);
});

test("WhatsApp comparte solo nombre, categoría y solicitud de cita", () => {
  const href = assessmentWhatsAppHref("IPSS", "Síntomas leves");
  const decoded = decodeURIComponent(href);
  assert.match(decoded, /evaluación de IPSS/);
  assert.match(decoded, /categoría orientativa fue Síntomas leves/);
  assert.doesNotMatch(decoded, /puntaje|respuesta|q0|edad/i);
  assert.match(href, /^https:\/\/wa\.me\/528712657523\?text=/);
});

test("interfaz no usa URL, localStorage ni analítica clínica", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) =>
    readFile("src/components/assessment/AssessmentShell.astro", "utf8"),
  );
  assert.doesNotMatch(source, /localStorage|sessionStorage|URLSearchParams|history\.pushState/);
  assert.doesNotMatch(source, /analytics.*(score|category|answer|flag)/i);
  assert.match(source, /fieldset/);
  assert.match(source, /aria-live/);
  assert.match(source, /focus/);
});

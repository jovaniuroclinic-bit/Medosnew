import assert from "node:assert/strict";
import test from "node:test";
import { buildFunctionalProfile, FUNCTIONAL_DOMAINS } from "../../src/lib/assessments/functionalHealth.ts";

test("perfil funcional devuelve todos los dominios sin diagnóstico", () => {
  const profile = buildFunctionalProfile({ sleep: 3, activity: 2, urinary: 1, desire: 1 });
  assert.deepEqual(Object.keys(profile.domains), [...FUNCTIONAL_DOMAINS]);
  assert.equal(profile.diagnostic, false);
  assert.match(profile.category, /Perfil/);
});

test("perfil funcional tolera valores faltantes de forma segura", () => {
  const profile = buildFunctionalProfile({});
  assert.ok(Object.values(profile.domains).every((value) => value === 0));
});

test("página funcional conserva CTA integral y aviso de no diagnóstico", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) =>
    readFile("src/pages/autoevaluacion/salud-funcional.astro", "utf8"),
  );
  assert.match(source, /No es una escala diagnóstica validada/);
  assert.match(source, /salud masculina/);
});

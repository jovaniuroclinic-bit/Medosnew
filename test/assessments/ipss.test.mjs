import assert from "node:assert/strict";
import test from "node:test";
import { scoreIpSS } from "../../src/lib/assessments/ipss.ts";

test("IPSS clasifica mínimo, leve, moderado, severo y máximo", () => {
  assert.equal(scoreIpSS([0, 0, 0, 0, 0, 0, 0]).category, "Sin síntomas relevantes");
  assert.equal(scoreIpSS([1, 1, 1, 1, 1, 1, 1]).category, "Síntomas leves");
  assert.equal(scoreIpSS([2, 2, 2, 2, 0, 0, 0]).category, "Síntomas moderados");
  assert.equal(scoreIpSS([3, 3, 3, 3, 3, 3, 2]).category, "Síntomas severos");
  assert.equal(scoreIpSS([5, 5, 5, 5, 5, 5, 5]).score, 35);
});

test("calidad de vida queda fuera del total sintomático", () => {
  const symptoms = [1, 1, 1, 1, 1, 1, 1];
  assert.equal(scoreIpSS(symptoms).score, 7);
});

test("IPSS rechaza respuestas incompletas y fuera de rango", () => {
  assert.throws(() => scoreIpSS([1, 2]), /siete/);
  assert.throws(() => scoreIpSS([6, 0, 0, 0, 0, 0, 0]), RangeError);
});

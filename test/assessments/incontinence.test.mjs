import assert from "node:assert/strict";
import test from "node:test";
import { determineLeakagePattern, scoreIncontinence } from "../../src/lib/assessments/incontinence.ts";
import { hasRedFlag } from "../../src/lib/assessments/redFlags.ts";

test("identifica patrones orientativos de esfuerzo, urgencia y mixto", () => {
  assert.equal(determineLeakagePattern(3, 0), "Esfuerzo");
  assert.equal(determineLeakagePattern(0, 3), "Urgencia");
  assert.equal(determineLeakagePattern(2, 2), "Mixto");
  assert.equal(determineLeakagePattern(0, 0), "Indeterminado");
});

test("clasifica impacto y rechaza respuestas incompletas", () => {
  assert.equal(scoreIncontinence(Array(7).fill(0)).category, "Impacto bajo");
  assert.equal(scoreIncontinence(Array(7).fill(1)).category, "Impacto moderado");
  assert.equal(scoreIncontinence(Array(7).fill(3)).category, "Impacto alto");
  assert.throws(() => scoreIncontinence([1]), /incompleta/);
});

test("banderas rojas tienen prioridad independiente", () => {
  assert.equal(hasRedFlag({ hematuria: true }), true);
  assert.equal(hasRedFlag({ fever: true }), true);
});

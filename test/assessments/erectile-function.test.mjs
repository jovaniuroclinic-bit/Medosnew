import assert from "node:assert/strict";
import test from "node:test";
import { scoreErectileFunction } from "../../src/lib/assessments/erectileFunction.ts";
import { hasRedFlag } from "../../src/lib/assessments/redFlags.ts";

test("evaluación eréctil calcula categorías y límites", () => {
  assert.equal(scoreErectileFunction(Array(10).fill(0)).category, "Sin señales relevantes");
  assert.equal(scoreErectileFunction(Array(10).fill(1)).category, "Señales leves");
  assert.equal(scoreErectileFunction(Array(10).fill(2)).category, "Señales importantes");
  assert.equal(scoreErectileFunction(Array(10).fill(3)).score, 30);
});

test("evaluación eréctil rechaza incompletos y detecta banderas rojas", () => {
  assert.throws(() => scoreErectileFunction([1, 2]), /incompleta/);
  assert.equal(hasRedFlag({ priapism: true }), true);
  assert.equal(hasRedFlag({ cardiovascular: "yes" }), true);
});

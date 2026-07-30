import test from "node:test";
import assert from "node:assert/strict";
import {evaluateAction} from "../build/policyEngine.js";
import {containsSensitiveData, redact} from "../build/redaction.js";
import {transition} from "../build/stateMachine.js";

test("rechaza herramientas prohibidas", () => {
  const result = evaluateAction({tool: "credentialExtraction", arguments: {}, reason: "prueba"});
  assert.equal(result.allowed, false);
  assert.equal(result.classification, "PROHIBITED");
});
test("requiere confirmación completa para destructivas", () => {
  const result = evaluateAction({tool: "restore", arguments: {}, reason: "prueba"}, "DESTRUCTIVE");
  assert.equal(result.confirmation, "reauth");
});
test("redacta secretos y correo sintético", () => {
  assert.equal(containsSensitiveData("token=synthetic_long_value_for_testing_only_123"), true);
  assert.doesNotMatch(redact("demo@example.invalid"), /demo@/u);
});
test("impide transición inválida", () => assert.throws(() => transition("IDLE", "RUNNING")));

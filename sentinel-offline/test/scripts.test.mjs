import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {globSync} from "node:fs";

test("scripts no usan curl pipe shell ni escuchan públicamente", () => {
  for (const file of globSync("scripts/*.sh", {cwd: new URL("..", import.meta.url)})) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(text, /curl[^\\n]*\|\s*(?:ba)?sh/u);
    assert.doesNotMatch(text, /0\.0\.0\.0/u);
    assert.doesNotMatch(text, /rm\s+-rf\s+["']?\/(?:\s|$)/u);
  }
});
test("modelo y runtime están fijados", () => {
  const config = JSON.parse(readFileSync(new URL("../config/models.example.json", import.meta.url), "utf8"));
  assert.match(config.primary.sha256, /^[a-f0-9]{64}$/u);
  assert.match(config.llamaCpp.commit, /^[a-f0-9]{40}$/u);
});

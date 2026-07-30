import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createCase} from "../build/forensic/cases.js";
import {acquireEvidence} from "../build/forensic/evidence.js";
import {sha256File} from "../build/forensic/hashing.js";

test("preserva original sintético y registra custodia", async () => {
  const root = mkdtempSync(join(tmpdir(), "sentinel-cases-"));
  process.env.MEDOS_SENTINEL_CASES_DIR = root;
  const source = join(root, "synthetic.txt"); writeFileSync(source, "evidencia sintética");
  const forensicCase = createCase("Caso sintético", "synthetic");
  const item = await acquireEvidence(forensicCase.id, source);
  assert.equal(item.sha256, await sha256File(source));
  assert.match(readFileSync(join(root, forensicCase.id, "custody.jsonl"), "utf8"), /adquisición autorizada/u);
});

import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {chunkMarkdown} from "../build/knowledge/chunker.js";
import {openMemory} from "../build/knowledge/indexer.js";
import {importDocument} from "../build/knowledge/importer.js";
import {searchKnowledge} from "../build/knowledge/search.js";

test("fragmenta e indexa documento sintético con cita", () => {
  const root = mkdtempSync(join(tmpdir(), "sentinel-knowledge-"));
  writeFileSync(join(root, "README.md"), "# Seguridad\nProcedimiento de restauración verificable.");
  const db = openMemory(join(root, "memory.db"));
  assert.equal(chunkMarkdown("# A\ntexto").length, 1);
  importDocument(db, root, "README.md", "0".repeat(40));
  assert.equal(searchKnowledge(db, "restauración").length, 1);
  db.close();
});
test("rechaza path traversal", () => {
  const root = mkdtempSync(join(tmpdir(), "sentinel-traversal-"));
  const db = openMemory(join(root, "memory.db"));
  assert.throws(() => importDocument(db, root, "../outside.md", "0".repeat(40)));
  db.close();
});

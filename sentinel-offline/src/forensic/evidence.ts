import {copyFileSync, lstatSync, statSync, writeFileSync} from "node:fs";
import {basename, join} from "node:path";
import {randomBytes} from "node:crypto";
import {casesRoot, safeCasePath} from "./cases.js";
import {sha256File} from "./hashing.js";
import {appendCustody} from "./custody.js";
export async function acquireEvidence(caseId: string, source: string) {
  const root = casesRoot(); const caseDir = safeCasePath(root, caseId);
  const info = lstatSync(source);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error("Solo archivos regulares, no symlinks");
  const id = `EVD-${randomBytes(8).toString("hex")}`;
  const target = join(caseDir, "originals", `${id}-${basename(source).replace(/[^\p{L}\p{N}._-]/gu, "_")}`);
  copyFileSync(source, target); const hash = await sha256File(target);
  const item = {id, caseId, sha256: hash, size: statSync(target).size, sourceName: basename(source), acquiredAt: new Date().toISOString()};
  writeFileSync(join(caseDir, `${id}.json`), JSON.stringify(item, null, 2), {mode: 0o600, flag: "wx"});
  appendCustody(join(caseDir, "custody.jsonl"), "adquisición autorizada", hash);
  return item;
}

import {lstatSync, readFileSync, realpathSync, statSync} from "node:fs";
import {relative, resolve, sep} from "node:path";
import {createHash} from "node:crypto";
import {containsSensitiveData} from "../redaction.js";
import {chunkMarkdown} from "./chunker.js";
import type {DatabaseSync} from "node:sqlite";

export function importDocument(db: DatabaseSync, root: string, candidate: string, commit: string): number {
  const safeRoot = realpathSync(root); const absolute = realpathSync(resolve(root, candidate));
  if (!absolute.startsWith(`${safeRoot}${sep}`) && absolute !== safeRoot) throw new Error("Ruta fuera del repositorio");
  const rel = relative(safeRoot, absolute).replaceAll("\\", "/");
  if (/(^|\/)(\.git|node_modules|dist|\.astro|\.wrangler|backups|evidence|cases|logs)(\/|$)/u.test(rel)) throw new Error("Ruta excluida");
  const info = lstatSync(absolute);
  if (!info.isFile() || info.isSymbolicLink() || statSync(absolute).size > 2_000_000) throw new Error("Documento no admitido");
  if (!/\.(md|txt|json|ya?ml|ts|sh)$/iu.test(rel)) throw new Error("Tipo no permitido");
  const text = readFileSync(absolute, "utf8");
  if (containsSensitiveData(text)) throw new Error("Documento rechazado por posible secreto o dato personal");
  const hash = createHash("sha256").update(text).digest("hex");
  db.prepare("INSERT INTO documents(source,path,commit_hash,sha256,imported_at,classification,permission) VALUES(?,?,?,?,?,?,?) ON CONFLICT(path) DO UPDATE SET commit_hash=excluded.commit_hash,sha256=excluded.sha256,imported_at=excluded.imported_at")
    .run("MEDOS", rel, commit, hash, new Date().toISOString(), "public-internal", "authorized-local-use");
  const row = db.prepare("SELECT id FROM documents WHERE path=?").get(rel) as {id: number};
  db.prepare("DELETE FROM chunks WHERE document_id=?").run(row.id);
  for (const chunk of chunkMarkdown(text)) {
    db.prepare("INSERT INTO chunks(document_id,section,content,sha256) VALUES(?,?,?,?)")
      .run(row.id, chunk.section, chunk.content, createHash("sha256").update(chunk.content).digest("hex"));
  }
  return row.id;
}

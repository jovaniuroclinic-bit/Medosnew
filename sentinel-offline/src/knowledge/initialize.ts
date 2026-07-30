import {readdirSync, statSync} from "node:fs";
import {relative, resolve} from "node:path";
import type {DatabaseSync} from "node:sqlite";
import {importDocument} from "./importer.js";
const roots = ["README.md", "SECURITY.md", "docs", "sentinel-offline/README.md", "sentinel-offline/knowledge"];
const excluded = /(^|\/)(\.git|node_modules|dist|\.astro|\.wrangler|backups|evidence|cases|logs)(\/|$)|(^|\/)(?:\.env|\.dev\.vars)/u;
function files(path: string): string[] {
  try {
    const info = statSync(path, {throwIfNoEntry: false});
    if (!info) return [];
    if (info.isFile()) return [path];
    if (!info.isDirectory()) return [];
    return readdirSync(path).flatMap((name) => files(resolve(path, name)));
  } catch { return []; }
}
export function initializeKnowledge(db: DatabaseSync, repository: string, commit: string): {imported: number; rejected: number} {
  let imported = 0; let rejected = 0;
  for (const entry of roots.flatMap((path) => files(resolve(repository, path)))) {
    const rel = relative(repository, entry).replaceAll("\\", "/");
    if (excluded.test(rel)) { rejected++; continue; }
    try { importDocument(db, repository, rel, commit); imported++; } catch { rejected++; }
  }
  return {imported, rejected};
}

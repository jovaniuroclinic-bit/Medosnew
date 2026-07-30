import {randomBytes} from "node:crypto";
import {mkdirSync, realpathSync, writeFileSync} from "node:fs";
import {join, resolve, sep} from "node:path";
export type ForensicCase = {id: string; createdAt: string; title: string; status: "open"; classification: "synthetic" | "authorized" | "restricted"};
export function casesRoot(): string {
  const configured = process.env.MEDOS_SENTINEL_CASES_DIR;
  if (!configured) throw new Error("Defina MEDOS_SENTINEL_CASES_DIR fuera del repositorio");
  mkdirSync(configured, {recursive: true, mode: 0o700});
  return realpathSync(configured);
}
export function safeCasePath(root: string, child: string): string {
  const path = resolve(root, child);
  if (!path.startsWith(`${root}${sep}`)) throw new Error("Ruta de caso inválida");
  return path;
}
export function createCase(title: string, classification: ForensicCase["classification"] = "authorized"): ForensicCase {
  const clean = [...title.normalize("NFC")].filter((character) => { const code = character.codePointAt(0) ?? 0; return code >= 32 && code !== 127; }).join("").trim().slice(0, 120);
  if (!clean) throw new Error("Título requerido");
  const now = new Date(); const stamp = now.toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}/u, "");
  const item: ForensicCase = {id: `CASE-${stamp}-${randomBytes(4).toString("hex")}`, createdAt: now.toISOString(), title: clean, status: "open", classification};
  const directory = join(casesRoot(), item.id);
  mkdirSync(join(directory, "originals"), {recursive: true, mode: 0o700});
  mkdirSync(join(directory, "working"), {recursive: true, mode: 0o700});
  writeFileSync(join(directory, "case.json"), JSON.stringify(item, null, 2), {mode: 0o600, flag: "wx"});
  writeFileSync(join(directory, "custody.jsonl"), "", {mode: 0o600, flag: "wx"});
  return item;
}

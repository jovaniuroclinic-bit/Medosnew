import {mkdirSync, readFileSync, renameSync, writeFileSync} from "node:fs";
import {dirname} from "node:path";
export type Checkpoint = {id: string; timestamp: string; state: string; nextStep: string; completed: string[]};
export function saveCheckpoint(path: string, value: Checkpoint): void {
  mkdirSync(dirname(path), {recursive: true, mode: 0o700});
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, JSON.stringify(value, null, 2), {mode: 0o600});
  renameSync(temporary, path);
}
export function loadCheckpoint(path: string): Checkpoint | undefined {
  try { return JSON.parse(readFileSync(path, "utf8")) as Checkpoint; } catch { return undefined; }
}

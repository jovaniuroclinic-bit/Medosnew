import {copyFileSync, lstatSync} from "node:fs";
import {sha256File} from "../forensic/hashing.js";
import type {DatabaseSync} from "node:sqlite";
const forgettable = new Set(["decisions", "tasks", "checkpoints"]);
export function forgetMemory(db: DatabaseSync, table: string): number {
  if (!forgettable.has(table)) throw new Error("Solo decisions, tasks o checkpoints");
  const result = db.prepare(`DELETE FROM ${table}`).run();
  return Number(result.changes);
}
export async function exportMemory(databasePath: string, destination: string): Promise<{sha256: string}> {
  if (lstatSync(databasePath).isSymbolicLink()) throw new Error("Base symlink rechazada");
  copyFileSync(databasePath, destination, 0);
  return {sha256: await sha256File(destination)};
}
export async function verifyMemory(databasePath: string, expected?: string): Promise<{ok: boolean; sha256: string}> {
  const sha256 = await sha256File(databasePath);
  return {ok: expected ? sha256 === expected : true, sha256};
}

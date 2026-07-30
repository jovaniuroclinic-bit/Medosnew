import {readFileSync} from "node:fs";
import {sha256File} from "./hashing.js";
export async function verifyManifest(path: string): Promise<{ok: boolean; failures: string[]}> {
  const manifest = JSON.parse(readFileSync(path, "utf8")) as {files: {path: string; sha256: string}[]};
  const failures: string[] = [];
  for (const item of manifest.files) if (await sha256File(item.path) !== item.sha256) failures.push(item.path);
  return {ok: failures.length === 0, failures};
}

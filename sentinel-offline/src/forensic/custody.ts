import {appendFileSync, lstatSync} from "node:fs";
import {randomUUID} from "node:crypto";
import {redact} from "../redaction.js";
export function appendCustody(path: string, action: string, itemHash: string, actor = "authorized-local-user"): void {
  if (lstatSync(path).isSymbolicLink()) throw new Error("Cadena de custodia no puede ser symlink");
  const event = {id: randomUUID(), timestamp: new Date().toISOString(), action: redact(action), sha256: itemHash, actor};
  appendFileSync(path, `${JSON.stringify(event)}\n`, {encoding: "utf8", mode: 0o600});
}

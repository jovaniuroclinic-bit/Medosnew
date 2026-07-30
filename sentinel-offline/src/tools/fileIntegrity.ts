import {sha256File} from "../forensic/hashing.js";
export async function fileIntegrity(args: Record<string, unknown>) {
  const path = String(args.path ?? "");
  if (!path) return {ok: false, summary: "Falta ruta"};
  return {ok: true, summary: `SHA-256 calculado`, details: {sha256: await sha256File(path)}};
}

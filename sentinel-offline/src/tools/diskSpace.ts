import {statfsSync} from "node:fs";
export async function diskSpace(args: Record<string, unknown>) {
  const stats = statfsSync(String(args.path ?? process.cwd()));
  return {ok: true, summary: "Espacio calculado", details: {freeBytes: Number(stats.bavail) * Number(stats.bsize)}};
}

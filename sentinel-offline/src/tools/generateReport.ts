import {writeFileSync} from "node:fs";
export async function generateReport(args: Record<string, unknown>) {
  const path = String(args.path ?? ""); if (!path) return {ok: false, summary: "Falta destino"};
  writeFileSync(path, String(args.content ?? "").slice(0, 100_000), {mode: 0o600, flag: "wx"});
  return {ok: true, summary: "Informe local creado"};
}

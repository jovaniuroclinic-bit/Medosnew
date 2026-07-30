import {execFile} from "node:child_process";
import {promisify} from "node:util";
const run = promisify(execFile);
export async function gitBackup(args: Record<string, unknown>) {
  const script = String(args.script ?? "scripts/security/backup-github.sh");
  const destination = String(args.destination ?? "");
  if (!destination) return {ok: false, summary: "Falta destino externo"};
  await run(script, [], {env: {...process.env, MEDOS_BACKUP_DIR: destination}, timeout: 300_000});
  return {ok: true, summary: "Backup Git verificable creado"};
}

import {execFile} from "node:child_process";
import {promisify} from "node:util";
const run = promisify(execFile);
export async function verifyBackup(args: Record<string, unknown>) {
  const archive = String(args.archive ?? "");
  if (!archive) return {ok: false, summary: "Falta archivo de backup"};
  await run(String(args.script ?? "scripts/security/verify-github-backup.sh"), [archive], {timeout: 300_000});
  return {ok: true, summary: "Checksum, refs y git fsck correctos"};
}

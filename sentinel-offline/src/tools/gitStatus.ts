import {execFile} from "node:child_process";
import {promisify} from "node:util";
const run = promisify(execFile);
export async function gitStatus(args: Record<string, unknown>) {
  const cwd = String(args.cwd ?? process.cwd());
  const {stdout} = await run("git", ["status", "--short", "--branch"], {cwd, timeout: 15_000, maxBuffer: 200_000});
  return {ok: true, summary: stdout.trim() || "Git limpio"};
}

import {execFile} from "node:child_process"; import {promisify} from "node:util";
const run = promisify(execFile);
export async function localProcesses() {
  const {stdout} = await run("ps", ["-A", "-o", "PID,NAME"], {timeout: 10_000, maxBuffer: 200_000});
  return {ok: true, summary: "Procesos locales revisados", details: stdout.split("\n").slice(0, 100)};
}

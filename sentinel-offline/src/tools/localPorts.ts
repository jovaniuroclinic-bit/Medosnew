import {execFile} from "node:child_process"; import {promisify} from "node:util";
const run = promisify(execFile);
export async function localPorts() {
  try {
    const {stdout} = await run("ss", ["-ltn"], {timeout: 10_000, maxBuffer: 100_000});
    return {ok: true, summary: "Puertos locales revisados", details: stdout.split("\n").slice(0, 100)};
  } catch { return {ok: false, summary: "ss no está disponible en este entorno"}; }
}

import {createServer, type IncomingMessage, type ServerResponse} from "node:http";
import {createWriteStream, mkdirSync, readFileSync, statSync, unlinkSync} from "node:fs";
import {randomUUID} from "node:crypto";
import {extname, join, normalize, resolve, sep} from "node:path";
import {fileURLToPath} from "node:url";
import {homedir} from "node:os";
import {localChat} from "./chat.js";
import {ProjectStore} from "./project/store.js";
import {analyzePortfolio, nextTdahTask} from "./project/analysis.js";
import {quarantineFile} from "./security/quarantine.js";
import {requirePermission} from "./roles.js";

const uiRoot = resolve(fileURLToPath(new URL("../ui", import.meta.url)));
const dataDir = process.env.MEDOS_SENTINEL_DATA_DIR ?? join(homedir(), ".local", "share", "medos-sentinel");
const projects = new ProjectStore(join(dataDir, "projects.json"));
const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml",
};

function secureHeaders(response: ServerResponse, type: string, status = 200): void {
  response.writeHead(status, {
    "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer", "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Resource-Policy": "same-origin",
  });
}
function json(response: ServerResponse, status: number, payload: unknown): void {
  secureHeaders(response, "application/json; charset=utf-8", status);
  response.end(JSON.stringify(payload));
}
function hostAllowed(request: IncomingMessage): boolean {
  return /^127\.0\.0\.1(?::\d{1,5})?$/u.test(request.headers.host ?? "");
}
function mutationAllowed(request: IncomingMessage): boolean {
  const origin = request.headers.origin;
  return hostAllowed(request) && origin === `http://${request.headers.host}`
    && request.headers["x-sentinel-intent"] === "local-ui";
}
async function jsonBody(request: IncomingMessage): Promise<unknown> {
  if (!request.headers["content-type"]?.startsWith("application/json")) throw new Error("UNSUPPORTED");
  const declared = Number(request.headers["content-length"] ?? 0);
  if (declared > 16_384) throw new Error("BODY_TOO_LARGE");
  const chunks: Buffer[] = []; let size = 0;
  for await (const raw of request) {
    const chunk = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
    size += chunk.length; if (size > 16_384) throw new Error("BODY_TOO_LARGE"); chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
async function receiveFile(request: IncomingMessage): Promise<unknown> {
  const size = Number(request.headers["content-length"] ?? 0);
  if (!Number.isFinite(size) || size < 1 || size > 25 * 1024 * 1024) throw new Error("BODY_TOO_LARGE");
  if (request.headers["content-type"] !== "application/octet-stream") throw new Error("UNSUPPORTED");
  const incoming = join(dataDir, "incoming"); mkdirSync(incoming, {recursive: true, mode: 0o700});
  const source = join(incoming, `${randomUUID()}.upload`);
  await new Promise<void>((accept, reject) => {
    const output = createWriteStream(source, {flags: "wx", mode: 0o600});
    request.on("error", reject); output.on("error", reject); output.on("finish", accept); request.pipe(output);
  });
  try {
    const record = await quarantineFile(source, join(dataDir, "quarantine"));
    return {...record, originalName: String(request.headers["x-file-name"] ?? "archivo").slice(0, 120)};
  } finally { try { unlinkSync(source); } catch {} }
}
async function api(request: IncomingMessage, response: ServerResponse, url: URL): Promise<boolean> {
  if (url.pathname === "/api/state" && request.method === "GET") {
    const portfolio = projects.read();
    json(response, 200, {
      mode: "TDAH", network: false, model: false, state: "IDLE",
      done: ["Sentinel Offline", "Policy Engine", "Backup verificable"],
      now: nextTdahTask(portfolio.tasks) ?? {title: "Crear primer proyecto", firstStep: "Define un objetivo"},
      pending: ["Revisar proyecto", "Validar checkpoint", "Crear backup"].slice(0, 3),
      projects: portfolio.projects.length,
    }); return true;
  }
  if (url.pathname === "/api/projects" && request.method === "GET") {
    const portfolio = projects.read();
    json(response, 200, {...portfolio, findings: analyzePortfolio(portfolio.projects, portfolio.tasks)}); return true;
  }
  if (url.pathname === "/api/projects" && request.method === "POST") {
    if (!mutationAllowed(request)) { json(response, 403, {error: "Solicitud rechazada"}); return true; }
    requirePermission("OWNER", "manage_projects");
    const portfolio = projects.addProject(await jsonBody(request));
    json(response, 201, {accepted: true, projects: portfolio.projects.length}); return true;
  }
  if (url.pathname === "/api/chat" && request.method === "POST") {
    if (!mutationAllowed(request)) { json(response, 403, {error: "Solicitud rechazada"}); return true; }
    const value = await jsonBody(request) as {message?: unknown};
    json(response, 200, localChat(typeof value.message === "string" ? value.message : "")); return true;
  }
  if (url.pathname === "/api/quarantine" && request.method === "POST") {
    if (!mutationAllowed(request)) { json(response, 403, {error: "Solicitud rechazada"}); return true; }
    requirePermission("OWNER", "quarantine_files");
    json(response, 202, {accepted: true, record: await receiveFile(request)}); return true;
  }
  if (url.pathname.startsWith("/api/")) { json(response, 404, {error: "No encontrado"}); return true; }
  return false;
}
function staticFile(response: ServerResponse, path: string): void {
  const requested = path === "/" ? "/index.html" : path;
  const target = normalize(resolve(uiRoot, `.${requested}`));
  if (!target.startsWith(`${uiRoot}${sep}`)) { secureHeaders(response, "text/plain", 404); response.end("No encontrado"); return; }
  try {
    if (!statSync(target).isFile()) throw new Error();
    secureHeaders(response, mime[extname(target)] ?? "application/octet-stream");
    response.end(readFileSync(target));
  } catch { secureHeaders(response, "text/plain; charset=utf-8", 404); response.end("No encontrado"); }
}
export function startLocalServer(port = 4317) {
  const server = createServer(async (request, response) => {
    try {
      if (!hostAllowed(request)) { json(response, 421, {error: "Host rechazado"}); return; }
      const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
      if (await api(request, response, url)) return;
      staticFile(response, url.pathname);
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      json(response, code === "BODY_TOO_LARGE" ? 413 : code === "UNSUPPORTED" ? 415 : 400, {error: "Solicitud inválida"});
    }
  });
  server.listen(port, "127.0.0.1");
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.MEDOS_SENTINEL_PORT ?? 4317);
  startLocalServer(port);
  console.log(`MEDOS Sentinel One: http://127.0.0.1:${port}`);
}

#!/usr/bin/env node
import {existsSync} from "node:fs";
import {homedir} from "node:os";
import {join, resolve} from "node:path";
import {MENU, tdahStatus} from "./menu.js";
import {loadCheckpoint} from "./checkpoint.js";
import {openMemory} from "./knowledge/indexer.js";
import {initializeKnowledge} from "./knowledge/initialize.js";
import {execFileSync} from "node:child_process";
import {searchKnowledge} from "./knowledge/search.js";
import {formatCitation} from "./knowledge/citations.js";
import {exportMemory, forgetMemory, verifyMemory} from "./knowledge/memory.js";
import {createCase} from "./forensic/cases.js";
import {verifyManifest} from "./forensic/verify.js";
import {verifyBackup} from "./tools/verifyBackup.js";
import {ToolRegistry} from "./toolRegistry.js";
import {gitStatus} from "./tools/gitStatus.js";
import {diskSpace} from "./tools/diskSpace.js";
import {emergencyChecklist} from "./tools/emergencyChecklist.js";
import {Orchestrator} from "./orchestrator.js";

const dataDir = process.env.MEDOS_SENTINEL_DATA_DIR ?? join(homedir(), ".local", "share", "medos-sentinel");
const dbPath = join(dataDir, "sentinel.db");
const checkpointPath = join(dataDir, "checkpoint.json");
const registry = new ToolRegistry();
registry.register({name: "gitStatus", classification: "READ_ONLY", description: "Leer estado Git", execute: gitStatus});
registry.register({name: "diskSpace", classification: "READ_ONLY", description: "Calcular espacio libre", execute: diskSpace});
registry.register({name: "emergencyChecklist", classification: "READ_ONLY", description: "Mostrar checklist defensivo", execute: emergencyChecklist});
const orchestrator = new Orchestrator(registry, checkpointPath, process.env.MEDOS_ASSISTED === "true");

async function main(): Promise<void> {
  process.env.NETWORK_DISABLED ??= "true";
  const [command = "menu", ...args] = process.argv.slice(2);
  if (command === "menu") { console.log(MENU); return; }
  if (command === "estado") {
    const cp = loadCheckpoint(checkpointPath);
    console.log(tdahStatus(cp?.completed.at(-1) ?? "Sentinel disponible", "Revisar el siguiente paso", cp ? [cp.nextStep] : ["Inicializar conocimiento"]));
    return;
  }
  if (command === "continuar") { console.log(loadCheckpoint(checkpointPath) ?? "No existe tarea anterior"); return; }
  if (command === "importar-conocimiento") { const repository = resolve(args.at(0) ?? process.cwd()); const commit = execFileSync("git", ["-C", repository, "rev-parse", "HEAD"], {encoding: "utf8"}).trim(); const db = openMemory(dbPath); try { console.log(initializeKnowledge(db, repository, commit)); } finally { db.close(); } return; }
  if (command === "consultar") {
    const db = openMemory(dbPath);
    try { for (const hit of searchKnowledge(db, args.join(" "))) console.log(`${hit.excerpt}\n${formatCitation(hit)}`); }
    finally { db.close(); }
    return;
  }
  if (command === "caso-nuevo") { console.log(createCase(args.join(" ") || "Caso autorizado").id); return; }
  if (command === "verificar-instalacion") {
    const model = process.env.MEDOS_MODEL_PATH ?? join(dataDir, "models", "Qwen3-4B-Q4_K_M.gguf");
    const checks = {node22: process.versions.node.startsWith("22."), networkDisabled: process.env.NETWORK_DISABLED === "true", modelPresent: existsSync(model), dataOutsideRepository: !resolve(dataDir).startsWith(`${resolve(process.cwd())}/`)};
    console.log(JSON.stringify(checks));
    if (!checks.node22 || !checks.networkDisabled || !checks.dataOutsideRepository) process.exitCode = 1;
    return;
  }
  if (command === "olvidar") { if (process.env.MEDOS_CONFIRM_FORGET !== "CONFIRMAR") throw new Error("Confirme con MEDOS_CONFIRM_FORGET=CONFIRMAR"); const db = openMemory(dbPath); try { console.log(["HECHO:", forgetMemory(db, args.at(0) ?? ""), "registros eliminados"].join(" ")); } finally { db.close(); } return; }
  if (command === "exportar-memoria") { const target = args.at(0); if (!target) throw new Error("Indique un destino privado"); console.log(await exportMemory(dbPath, target)); return; }
  if (command === "verificar-memoria") { console.log(await verifyMemory(dbPath, args.at(0))); return; }
  if (command === "backup") { console.log("Use backup-sentinel.sh con MEDOS_BACKUP_GPG_RECIPIENT; nunca se crea copia clara compartida"); return; }
  if (command === "verificar-backup") { const archive = args.at(0); if (!archive) throw new Error("Indique backup"); console.log((await verifyBackup({archive, script: "scripts/security/verify-github-backup.sh"})).summary); return; }
  if (command === "verificar-caso") { const manifest = args.at(0); if (!manifest) throw new Error("Indique manifest"); console.log(await verifyManifest(manifest)); return; }
  const mapping: Record<string, string> = {"revisar-seguridad": "gitStatus", "verificar-medos": "gitStatus", "emergencia": "emergencyChecklist"};
  const tool = mapping[command];
  if (tool) { console.log((await orchestrator.act({tool, arguments: {cwd: process.cwd()}, reason: command})).summary); return; }
  console.error("Comando no reconocido. Use: medos");
  process.exitCode = 2;
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Error local"); process.exitCode = 1; });

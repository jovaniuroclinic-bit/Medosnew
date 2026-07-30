#!/usr/bin/env node
import {execFileSync, spawnSync} from "node:child_process";
import {existsSync} from "node:fs";
import {basename, join} from "node:path";
import {createInterface} from "node:readline/promises";
import {stdin, stdout} from "node:process";
import {evaluateAction, type ToolClass} from "./policyEngine.js";
import {redactCli} from "./cliRedaction.js";

export const EXIT = {OK:0, GENERAL:1, ARGUMENTS:2, BLOCKED:3, HUMAN:4, VAULT:5, DEPENDENCY:6, UNHEALTHY:7, DIRTY:8, SECRET:9, REMOTE:10} as const;
const VERSION = "0.1.0";
const commands = ["status","doctor","start","stop","test","logs","resume","checkpoint","vault","auth","n8n","backup","recovery","emergency-lock","version"] as const;
type BaseStatus = "PASS"|"WARN"|"BLOCKED"|"FAIL";
type Result = {ok:boolean;status:BaseStatus;command:string;timestamp:string;data:Record<string,unknown>;warnings:string[];nextAction:string};

function git(root:string,args:string[],fallback="unknown"){try{return execFileSync("git",["-C",root,...args],{encoding:"utf8",stdio:["ignore","pipe","ignore"],timeout:5000}).trim()||fallback}catch{return fallback}}
function result(command:string,data:Record<string,unknown>,status:BaseStatus="PASS",warnings:string[]=[],nextAction=""):Result{return{ok:status==="PASS"||status==="WARN",status,command,timestamp:new Date().toISOString(),data,warnings,nextAction}}
function jsonOut(value:unknown){stdout.write(`${JSON.stringify(value)}\n`)}
function rootFrom(start=process.cwd()){const root=git(start,["rev-parse","--show-toplevel"],"");if(!root||!existsSync(join(root,"sentinel-offline","package.json"))||!existsSync(join(root,"scripts")))throw Object.assign(new Error("No está dentro del repositorio MEDOS"),{exitCode:EXIT.ARGUMENTS});return root}
function parse(args:string[],allowed:Set<string>){for(const arg of args)if(arg.startsWith("-")&&!allowed.has(arg)&&!arg.startsWith("--tail=")&&!arg.startsWith("--message=")&&!arg.startsWith("--reason="))throw Object.assign(new Error(`Opción no permitida: ${arg}`),{exitCode:EXIT.ARGUMENTS})}
function run(root:string,script:string,args:string[],timeout=300_000){const target=join(root,"scripts",script);if(!existsSync(target))throw Object.assign(new Error(`Dependencia ausente: scripts/${script}`),{exitCode:EXIT.DEPENDENCY});const out=spawnSync(target,args,{cwd:root,encoding:"utf8",shell:false,timeout,maxBuffer:1024*1024,env:{...process.env,MEDOS_CLI_DELEGATED:"1"}});if(out.error)throw out.error;if(out.stdout)stdout.write(redactCli(out.stdout));if(out.stderr)process.stderr.write(redactCli(out.stderr));return out.status??EXIT.GENERAL}
function policy(tool:string,classification:ToolClass,scope:string,rollback:string){const decision=evaluateAction({tool,arguments:{},reason:"Centinela CLI",scope,rollback},classification);if(!decision.allowed)throw Object.assign(new Error(decision.reason),{exitCode:EXIT.BLOCKED});return decision}

function status(root:string):Result{
 const branch=git(root,["branch","--show-current"]),head=git(root,["rev-parse","--short","HEAD"]),porcelain=git(root,["status","--porcelain"],"");
 const upstream=git(root,["rev-parse","--abbrev-ref","--symbolic-full-name","@{u}"],"not-configured");
 const sync=upstream==="not-configured"?"UNKNOWN":git(root,["rev-list","--left-right","--count",`${upstream}...HEAD`],"UNKNOWN");
 const cp=existsSync(join(root,"docs","continuity","SESSION_MANIFEST.json"));
 let pnpmVersion="unavailable";try{pnpmVersion=execFileSync("pnpm",["--version"],{encoding:"utf8",timeout:3000}).trim()}catch{}
 return result("status",{repository:basename(root),branch,head,workingTree:porcelain?"modified":"clean",origin:{upstream,sync},node:process.version,pnpm:pnpmVersion,launcher:{installed:existsSync(join(root,"sentinel-offline","launcher","package.json")),running:false},n8n:{installed:existsSync(join(root,"sentinel-offline","orchestrator","package.json")),running:false,bind:"127.0.0.1:5678",workflows:"inactive"},health:"local",bind:"127.0.0.1",vault:{available:false,selected:false},persistence:"BLOCKED_WITHOUT_VAULT",connections:"BLOCKED",backup:"requires-encrypted-vault",lastRestoreTest:null,lastCheckpoint:cp?"manifest-present":null,nextTask:"Validación humana de Termux y bóveda",ci:"not-queried",codeql:"not-queried"},"WARN",["Bóveda no seleccionada; operaciones sensibles bloqueadas"],"Seleccione una bóveda mediante el Launcher cuando esté disponible");
}
function help(){stdout.write(`CENTINELA MEDOS ${VERSION}

Uso: ./scripts/centinela <comando> [opciones]

Comandos:
  status [--json]                 Estado general
  doctor [--check|--fix-safe|--report|--json]
  start <launcher|n8n|all> [--no-browser]
  stop <launcher|n8n|all>
  test <quick|full|security>
  logs [launcher|n8n] [--tail N] [--follow]
  resume [--check|--print-prompt|--last-checkpoint]
  checkpoint --message TEXTO [--commit] [--push] [--wait-ci]
  vault <status|list|select|verify|lock>
  auth <status|open|list|prepare PROVEEDOR>
  n8n <status|start|stop|health|backup-metadata|restore-test|open>
  backup <status|create|verify|list>
  recovery <status|test|instructions|kit>
  emergency-lock [--reason TEXTO] [--confirm-lock]
  version
`)}
async function confirmLock(){if(!stdin.isTTY)return false;const rl=createInterface({input:stdin,output:stdout});try{return(await rl.question("Escriba BLOQUEAR para continuar: "))==="BLOQUEAR"}finally{rl.close()}}
async function menu(root:string){if(!stdin.isTTY){help();return}const rl=createInterface({input:stdin,output:stdout});const text=`CENTINELA MEDOS

1. Estado general
2. Continuar desarrollo
3. Abrir Launcher
4. Centro de autorizaciones
5. Revisar bóveda
6. Iniciar n8n
7. Detener servicios
8. Pruebas rápidas
9. Diagnóstico
10. Logs
11. Crear checkpoint
12. Recuperación
13. Bloqueo de emergencia
0. Salir
`;try{while(true){stdout.write(text);const choice=await rl.question("> ");if(choice==="0")return;const map:Record<string,string[]>= {"1":["status"],"2":["resume"],"3":["start","launcher"],"4":["auth","open"],"5":["vault","status"],"6":["n8n","start"],"7":["stop","all"],"8":["test","quick"],"9":["doctor","--check"],"10":["logs"],"12":["recovery","status"],"13":["emergency-lock"]};if(choice==="11"){stdout.write("Use checkpoint --message con un mensaje explícito.\n");continue}const selected=map[choice];if(!selected){stdout.write("Selección inválida.\n");continue}await dispatch(root,selected)}}finally{rl.close()}}

export async function dispatch(root:string,args:string[]):Promise<number>{
 const [command,...rest]=args;if(!command){await menu(root);return EXIT.OK}
 if(command==="help"||command==="--help"||command==="-h"){help();return EXIT.OK}
 if(command==="version"||command==="--version"){stdout.write(`Centinela ${VERSION} · MEDOS ${git(root,["describe","--tags","--always"])} · ${git(root,["rev-parse","--short","HEAD"])} · ${git(root,["branch","--show-current"])} · ${git(root,["status","--porcelain"],"")?"modificado":"limpio"}\n`);return EXIT.OK}
 if(!commands.includes(command as typeof commands[number]))throw Object.assign(new Error("Comando no reconocido"),{exitCode:EXIT.ARGUMENTS});
 if(command==="status"){parse(rest,new Set(["--json"]));const value=status(root);rest.includes("--json")?jsonOut(value):stdout.write(`${value.status} MEDOS\nRepositorio: ${value.data.repository}\nRama/HEAD: ${value.data.branch} ${value.data.head}\nWorking tree: ${value.data.workingTree}\nBind: 127.0.0.1\nBóveda: no seleccionada\nConexiones: BLOCKED\n`);return EXIT.OK}
 if(command==="doctor"){parse(rest,new Set(["--check","--fix-safe","--report","--json"]));return run(root,"medos-doctor",rest)}
 if(command==="test"){const mode=rest[0]??"quick";if(!["quick","full","security"].includes(mode)||rest.length>1)return EXIT.ARGUMENTS;return run(root,"medos-test",[`--${mode}`],900_000)}
 if(command==="logs"){parse(rest,new Set(["--follow","--tail"]));return run(root,"medos-logs",rest)}
 if(command==="resume"){parse(rest,new Set(["--check","--print-prompt","--last-checkpoint"]));return run(root,"medos-resume",rest)}
 if(command==="checkpoint"){parse(rest,new Set(["--message","--commit","--push","--wait-ci"]));return run(root,"medos-checkpoint",rest,900_000)}
 if(command==="start"||command==="stop"){policy(command,"REVERSIBLE",rest[0]??"","scripts/medos-stop");return run(root,command==="start"?"medos-start":"medos-stop",rest)}
 if(command==="emergency-lock"){parse(rest,new Set(["--reason","--confirm-lock"]));policy("emergencyLock","HIGH_RISK","local MEDOS services","preserve data and unlock only by owner");stdout.write("Acciones: bloquear conexiones, invalidar sesiones locales, pausar workflows y preservar datos.\n");if(!rest.includes("--confirm-lock")&&!await confirmLock())return EXIT.HUMAN;return run(root,"medos-emergency-lock",rest)}
 const sub=rest[0]??"status";
 if(command==="vault"){if(!["status","list","select","verify","lock"].includes(sub)||rest.length>1)return EXIT.ARGUMENTS;if(sub==="status"){stdout.write("Bóveda disponible: no\nBóveda seleccionada: no\nPersistencia: BLOCKED\n");return EXIT.OK}if(sub==="list"){stdout.write("proton-pass: requiere selección humana\nlibsecret: requiere verificación local\nsystemd-credentials: requiere verificación local\nencrypted-file: requiere clave externa y clic\n");return EXIT.OK}if(sub==="select"){stdout.write("PENDING HUMAN ACTION: abra el Launcher local y seleccione explícitamente una bóveda.\n");return EXIT.HUMAN}if(sub==="lock"){policy("vaultLock","REVERSIBLE","selected vault access","owner may unlock locally");return run(root,"medos-emergency-lock",["--vault-only","--confirm-lock"])}return EXIT.VAULT}
 if(command==="auth"){const providers=["google","github","cloudflare","meta","openai","proton"];if(sub==="status"){stdout.write("Autorizaciones: ninguna cuenta conectada; todas requieren clic humano.\n");return EXIT.OK}if(sub==="list"){stdout.write(`${providers.join("\n")}\n`);return EXIT.OK}if(sub==="open"){stdout.write("PENDING HUMAN ACTION: inicie el Launcher y abra únicamente su URL loopback.\n");return EXIT.HUMAN}if(sub==="prepare"&&providers.includes(rest[1]??"")){policy("prepareAuthorization","LOW_RISK",rest[1]??"","discard local pending session");stdout.write(`Preparación ${rest[1]}: prerrequisitos locales pendientes; no se conectó ninguna cuenta.\n`);return EXIT.HUMAN}return EXIT.ARGUMENTS}
 if(command==="n8n"){if(!["status","start","stop","health","backup-metadata","restore-test","open"].includes(sub))return EXIT.ARGUMENTS;if(["status","health"].includes(sub)){stdout.write("n8n: detenido o no verificado\nBind requerido: 127.0.0.1:5678\nWorkflows: inactivos\nCommunity Nodes: deshabilitados\n");return EXIT.OK}if(sub==="open"){stdout.write("PENDING HUMAN ACTION: inicie n8n y abra http://127.0.0.1:5678 localmente.\n");return EXIT.HUMAN}if(["start","stop"].includes(sub))return run(root,sub==="start"?"medos-start":"medos-stop",["n8n"]);policy(`n8n-${sub}`,"REVERSIBLE","metadata only","no credentials exported");return EXIT.VAULT}
 if(command==="backup"){if(!["status","create","verify","list"].includes(sub))return EXIT.ARGUMENTS;if(sub==="status"){stdout.write("Backup productivo: BLOCKED sin bóveda cifrada seleccionada.\n");return EXIT.OK}policy(`backup-${sub}`,"REVERSIBLE","encrypted backups only","source data preserved");stdout.write("BLOCKED: se requiere bóveda real y destino cifrado aprobado.\n");return EXIT.VAULT}
 if(command==="recovery"){if(!["status","test","instructions","kit"].includes(sub))return EXIT.ARGUMENTS;if(sub==="status"){stdout.write("Recuperación: runbook disponible; restore productivo no ejecutado.\n");return EXIT.OK}if(sub==="instructions"){stdout.write("Consulte docs/continuity/RECOVERY_RUNBOOK.md. No introduzca secretos en la CLI.\n");return EXIT.OK}return run(root,"medos-recovery",[sub])}
 return EXIT.ARGUMENTS;
}
async function main(){try{return await dispatch(rootFrom(),process.argv.slice(2))}catch(error){const e=error as Error&{exitCode?:number};process.stderr.write(`${redactCli(e.message||"Fallo local")}\n`);return e.exitCode??EXIT.GENERAL}}
if(import.meta.url===new URL(`file://${process.argv[1]}`).href)process.exitCode=await main();

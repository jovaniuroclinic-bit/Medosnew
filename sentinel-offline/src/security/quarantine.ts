import {closeSync, createReadStream, createWriteStream, lstatSync, mkdirSync, openSync, readSync, renameSync, statSync, writeFileSync} from "node:fs";
import {basename, extname, resolve, sep} from "node:path";
import {randomBytes} from "node:crypto";
import {sha256File} from "../forensic/hashing.js";
export type QuarantineState = "QUARANTINED" | "SCANNING" | "SUSPICIOUS" | "BLOCKED" | "SANITIZED" | "APPROVED" | "IMPORTED" | "DELETED";
export type QuarantineRecord = {id:string;originalName:string;safeName:string;sha256:string;size:number;detectedMime:string;state:QuarantineState;reasons:string[];createdAt:string};
const maximum = 25 * 1024 * 1024;
const dangerous = new Set([".apk",".dex",".exe",".dll",".so",".js",".mjs",".cjs",".sh",".html",".htm"]);
const signatures: [Buffer,string][] = [[Buffer.from("%PDF-"),"application/pdf"],[Buffer.from([0x50,0x4b,0x03,0x04]),"application/zip"],[Buffer.from([0x89,0x50,0x4e,0x47]),"image/png"],[Buffer.from([0xff,0xd8,0xff]),"image/jpeg"]];
function mime(header: Buffer): string { return signatures.find(([value])=>header.subarray(0,value.length).equals(value))?.[1] ?? "application/octet-stream"; }
function safeFilename(name:string):string { return basename(name).normalize("NFC").replace(/[^\p{L}\p{N}._-]/gu,"_").slice(0,120) || "archivo"; }
export async function quarantineFile(source:string,vault:string):Promise<QuarantineRecord>{
  const info=lstatSync(source);
  if(!info.isFile()||info.isSymbolicLink())throw new Error("Solo archivos regulares; symlinks rechazados");
  if(info.size<=0||info.size>maximum)throw new Error("Tamaño no permitido");
  const root=resolve(vault);mkdirSync(root,{recursive:true,mode:0o700});
  const id=`Q-${randomBytes(8).toString("hex")}`;const safeName=safeFilename(source);const destination=resolve(root,`${id}-${safeName}`);
  if(!destination.startsWith(`${root}${sep}`))throw new Error("Ruta de cuarentena inválida");
  const header=Buffer.alloc(4096);const fd=openSync(source,"r");try{readSync(fd,header,0,header.length,0);}finally{closeSync(fd);}
  const reasons:string[]=[];const parts=safeName.toLocaleLowerCase("en").split(".");
  if(parts.length>2&&dangerous.has(`.${parts.at(-2)}`))reasons.push("doble extensión peligrosa");
  if(dangerous.has(extname(safeName).toLocaleLowerCase("en")))reasons.push("tipo ejecutable o activo");
  if(/(?:<script|javascript:|vbaProject|AutoOpen|\/JavaScript)/iu.test(header.toString("utf8")))reasons.push("contenido activo o macro");
  const temporary=`${destination}.part`;const created=openSync(temporary,"wx",0o600);closeSync(created);
  await new Promise<void>((accept,reject)=>{const input=createReadStream(source);const output=createWriteStream(temporary,{flags:"r+",mode:0o600});input.on("error",reject);output.on("error",reject);output.on("finish",accept);input.pipe(output);});
  renameSync(temporary,destination);
  const record:QuarantineRecord={id,originalName:safeName,safeName,sha256:await sha256File(destination),size:statSync(destination).size,detectedMime:mime(header),state:reasons.length?"SUSPICIOUS":"QUARANTINED",reasons,createdAt:new Date().toISOString()};
  writeFileSync(`${destination}.json`,JSON.stringify(record,null,2),{mode:0o600,flag:"wx"});
  return record;
}

import {execFileSync} from "node:child_process";
import {readFileSync, statSync} from "node:fs";
const output=execFileSync("git",["ls-files","--cached","--others","--exclude-standard"],{encoding:"utf8"});
const files=[...new Set(output.trim().split("\n").filter(Boolean))];
const bad=/(?:^|[^A-Za-z0-9])(?:gh[pousr]_|github_pat_|cfat_|sk-)[A-Za-z0-9_-]{20,}|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/u;
for(const file of files){
  if(statSync(file).size>20_000_000)continue;
  if(bad.test(readFileSync(file,"utf8")))throw new Error(`Patrón sensible detectado en ${file}`);
}
console.log(`Secret scan PASS (${files.length} archivos rastreados y pendientes)`);

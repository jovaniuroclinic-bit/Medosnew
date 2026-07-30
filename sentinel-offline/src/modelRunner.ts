import {closeSync, existsSync, mkdirSync, openSync, readFileSync, unlinkSync} from "node:fs";
import {spawn} from "node:child_process";
import {dirname} from "node:path";
export type ModelOptions = {binary:string;model:string;context:number;tokens:number;threads:number;timeoutMs:number;lockPath:string;temperaturePath?:string;thermalLimit?:number};
function temperature(path?: string): number | undefined {
  if (!path || !existsSync(path)) return undefined;
  try { const value = Number(readFileSync(path, "utf8").trim()); return value > 1000 ? value / 1000 : value; } catch { return undefined; }
}
export async function runModel(prompt: string, options: ModelOptions): Promise<string> {
  if (!existsSync(options.binary)) throw new Error("Falta llama-cli; ejecute build-llama-cpp.sh");
  if (!existsSync(options.model)) throw new Error("Falta el modelo GGUF verificado");
  const heat = temperature(options.temperaturePath);
  if (heat !== undefined && heat >= (options.thermalLimit ?? 43)) throw new Error("Pausa térmica: deje enfriar el dispositivo");
  mkdirSync(dirname(options.lockPath), {recursive:true, mode:0o700});
  let lock:number; try { lock=openSync(options.lockPath,"wx",0o600); } catch { throw new Error("Ya existe una inferencia en ejecución"); }
  closeSync(lock);
  try {
    return await new Promise<string>((resolve,reject)=>{
      const args=["-m",options.model,"-p",prompt,"-c",String(options.context),"-n",String(options.tokens),"-t",String(options.threads),"--no-display-prompt"];
      const child=spawn(options.binary,args,{stdio:["ignore","pipe","pipe"],shell:false,env:{...process.env,NETWORK_DISABLED:"true"}});
      let output=""; let error="";
      const timer=setTimeout(()=>child.kill("SIGTERM"),options.timeoutMs);
      child.stdout.on("data",(chunk:Buffer)=>{if(output.length<1_000_000)output+=chunk.toString();});
      child.stderr.on("data",(chunk:Buffer)=>{if(error.length<8_000)error+=chunk.toString();});
      child.on("error",reject);
      child.on("close",(code)=>{clearTimeout(timer);code===0?resolve(output.trim()):reject(new Error(code===null?"Inferencia agotó el tiempo":`llama-cli terminó con código ${code}: ${error.slice(0,300)}`));});
    });
  } finally { try { unlinkSync(options.lockPath); } catch {} }
}

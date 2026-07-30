import {createServer} from "node:http";import {readFileSync} from "node:fs";import {fileURLToPath} from "node:url";import {randomUUID} from "node:crypto";
import {providers} from "../providers/registry.js";import {newSession,sessionValid,type LocalSession} from "./auth.js";import {createCsrf,validCsrf} from "./csrf.js";import {health} from "./health.js";import {detectVaults} from "./vault-selection.js";import {UnavailableVault} from "./vault-adapter.js";
const uiSource=fileURLToPath(new URL("../../src/ui/",import.meta.url)),uiBuild=fileURLToPath(new URL("../ui/",import.meta.url)),vault=new UnavailableVault(),sessions=new Map<string,LocalSession>();let locked=false;
const headers={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Permissions-Policy":"camera=(), microphone=(), geolocation=()","Content-Security-Policy":"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"};
function send(res:any,status:number,body:unknown,type="application/json; charset=utf-8"){res.writeHead(status,{"Content-Type":type,...headers});res.end(type.startsWith("application/json")?JSON.stringify(body):body)}
export function start(port=0){const server=createServer(async(req,res)=>{const incidentId=randomUUID();try{
if(req.socket.remoteAddress!=="127.0.0.1"&&req.socket.remoteAddress!=="::ffff:127.0.0.1")return send(res,403,{error:"Rechazado",incidentId});
if(!/^127\.0\.0\.1(?::\d+)?$/.test(req.headers.host??""))return send(res,421,{error:"Host rechazado",incidentId});
const url=new URL(req.url??"/",`http://${req.headers.host}`);let sid=(req.headers.cookie??"").match(/medos_session=([^;]+)/)?.[1],session=sid?sessions.get(sid):undefined;
if(url.pathname==="/api/session"&&req.method==="POST"){const csrf=createCsrf();session=newSession(csrf);sessions.set(session.id,session);res.setHeader("Set-Cookie",`medos_session=${session.id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=600`);return send(res,201,{csrf,expiresAtUtc:new Date(session.expires).toISOString()})}
if(url.pathname==="/api/health"&&req.method==="GET")return send(res,200,health(await vault.healthCheck()));
if(url.pathname.startsWith("/api/")&&!sessionValid(session))return send(res,401,{error:"Sesión expirada",incidentId});
if(url.pathname==="/api/vaults"&&req.method==="GET")return send(res,200,{selected:null,candidates:detectVaults()});
if(url.pathname==="/api/providers"&&req.method==="GET")return send(res,200,{locked,providers:providers.map(p=>({...p,state:locked?"LOCKED":"UNCONFIGURED",status:"Configuración requerida",actions:["Configurar","Ver permisos"]}))});
if(url.pathname==="/api/lock-all"&&req.method==="POST"){if(!validCsrf(session!.csrf,String(req.headers["x-csrf-token"]??"")))return send(res,403,{error:"Solicitud rechazada",incidentId});locked=true;sessions.clear();return send(res,200,{locked:true})}
if(url.pathname.startsWith("/api/"))return send(res,405,{error:"Método no permitido",incidentId});
const path=url.pathname==="/"?"index.html":url.pathname.slice(1);if(!["index.html","app.js","styles.css"].includes(path))return send(res,404,"No encontrado","text/plain");
const type=path.endsWith(".html")?"text/html; charset=utf-8":path.endsWith(".js")?"text/javascript; charset=utf-8":"text/css; charset=utf-8";const base=path==="app.js"?uiBuild:uiSource;return send(res,200,readFileSync(base+path,"utf8"),type);
}catch{return send(res,500,{error:"Error seguro",incidentId})}});server.listen(port,"127.0.0.1");return server}
if(process.argv[1]===fileURLToPath(import.meta.url)){const s=start(Number(process.env.MEDOS_ACCOUNTS_PORT??0));s.on("listening",()=>console.log(`MEDOS Accounts: http://127.0.0.1:${(s.address() as any).port}`))}

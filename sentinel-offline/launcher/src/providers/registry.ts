import type {Provider} from "./types.js";
function p(id:string,name:string,services:string[],oauth:boolean,requiredConfiguration:string[]):Provider{return{id,name,services,oauth,requiredConfiguration,defaultScopes:[]}}
export const providers:Provider[]=[
p("google","Google",["Gmail","Calendar","Drive","Contacts"],true,["clientId","redirectUri"]),
p("github","GitHub",["GitHub"],true,["clientId","redirectUri"]),
p("cloudflare","Cloudflare",["Cloudflare"],false,["vaultReference"]),
p("meta","Meta",["WhatsApp Business","Facebook","Instagram"],true,["clientId","redirectUri"]),
p("n8n","n8n",["n8n"],false,["credentialAlias"]),p("openai","OpenAI",["OpenAI"],false,["vaultReference"]),
p("mail","Correo",["SMTP","IMAP"],false,["vaultReference"]),p("s3","S3 compatible",["S3"],false,["vaultReference"]),
p("ssh","SSH",["SSH"],false,["keyReference"]),p("database","Base de datos",["Database"],false,["vaultReference"])
];

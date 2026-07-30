import {createCipheriv,createDecipheriv,createHash,randomBytes} from "node:crypto";
import {closeSync,fsyncSync,lstatSync,mkdirSync,openSync,readFileSync,renameSync,writeFileSync} from "node:fs";
import {dirname,resolve,sep} from "node:path";
export type DurableState={schemaVersion:1;providers:unknown[];authorizations:unknown[];workflowMap:unknown[];rotationHistory:unknown[];recoveryHistory:unknown[]};
const empty=():DurableState=>({schemaVersion:1,providers:[],authorizations:[],workflowMap:[],rotationHistory:[],recoveryHistory:[]});
export class EncryptedStore{
 readonly path:string;constructor(path:string,private key:Buffer,private allowedRoot=dirname(path)){if(key.length!==32)throw new Error("KEY_REQUIRED");const root=resolve(allowedRoot),target=resolve(path);if(!target.startsWith(root+sep))throw new Error("PATH_REJECTED");this.path=target}
 private safe(){mkdirSync(dirname(this.path),{recursive:true,mode:0o700});try{if(lstatSync(this.path).isSymbolicLink())throw new Error("SYMLINK_REJECTED")}catch(e){if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e}}
 read():DurableState{this.safe();try{const envelope=JSON.parse(readFileSync(this.path,"utf8"));const iv=Buffer.from(envelope.iv,"base64"),tag=Buffer.from(envelope.tag,"base64"),data=Buffer.from(envelope.data,"base64");const d=createDecipheriv("aes-256-gcm",this.key,iv);d.setAuthTag(tag);const state=JSON.parse(Buffer.concat([d.update(data),d.final()]).toString());if(state.schemaVersion!==1)throw new Error("SCHEMA_REJECTED");return state}catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return empty();throw e}}
 write(state:DurableState){this.safe();const iv=randomBytes(12),c=createCipheriv("aes-256-gcm",this.key,iv),data=Buffer.concat([c.update(JSON.stringify(state)),c.final()]);const envelope=JSON.stringify({version:1,algorithm:"AES-256-GCM",iv:iv.toString("base64"),tag:c.getAuthTag().toString("base64"),data:data.toString("base64"),checksum:createHash("sha256").update(data).digest("hex")});const temp=`${this.path}.${process.pid}.tmp`;writeFileSync(temp,envelope,{mode:0o600,flag:"wx"});const fd=openSync(temp,"r");fsyncSync(fd);closeSync(fd);renameSync(temp,this.path)}
}

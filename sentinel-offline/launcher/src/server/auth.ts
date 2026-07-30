import {randomBytes} from "node:crypto";
export type LocalSession={id:string;csrf:string;expires:number;reauthenticatedAt?:number};
export function newSession(csrf:string,ttlMs=10*60_000):LocalSession{return{id:randomBytes(32).toString("base64url"),csrf,expires:Date.now()+ttlMs}}
export const sessionValid=(s:LocalSession|undefined)=>Boolean(s&&s.expires>Date.now());
export const requireReauth=(s:LocalSession|undefined)=>Boolean(sessionValid(s)&&s?.reauthenticatedAt&&Date.now()-s.reauthenticatedAt<120_000);

import {randomBytes,timingSafeEqual} from "node:crypto";
export const createCsrf=()=>randomBytes(32).toString("base64url");
export function validCsrf(expected:string,actual:string|undefined){if(!actual)return false;const a=Buffer.from(expected),b=Buffer.from(actual);return a.length===b.length&&timingSafeEqual(a,b)}

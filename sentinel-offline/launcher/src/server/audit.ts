import {randomUUID} from "node:crypto";import {redact} from "./redaction.js";
export function audit(provider:string,action:string,result:string,referenceId?:string){return redact({date:new Date().toISOString(),actor:"local-owner",provider,action,result,referenceId,incidentId:randomUUID()})}

import {createHmac} from "node:crypto";
export function signWorkflowAudit(event: Record<string, unknown>, key: string) {
  const safe = JSON.stringify(event);
  return {event, auditHash:createHmac("sha256", key).update(safe).digest("hex")};
}

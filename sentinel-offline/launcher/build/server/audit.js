import { randomUUID } from "node:crypto";
import { redact } from "./redaction.js";
export function audit(provider, action, result, referenceId) { return redact({ date: new Date().toISOString(), actor: "local-owner", provider, action, result, referenceId, incidentId: randomUUID() }); }

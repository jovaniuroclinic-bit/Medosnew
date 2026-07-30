import {appendFileSync, mkdirSync} from "node:fs";
import {dirname} from "node:path";
import {randomUUID} from "node:crypto";
import {redact} from "./redaction.js";

export type AuditEvent = {
  action: string;
  classification: string;
  status: string;
  durationMs?: number;
};

export function writeAudit(path: string, event: AuditEvent): void {
  mkdirSync(dirname(path), {recursive: true, mode: 0o700});
  const safe = {
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    action: redact(event.action),
    classification: redact(event.classification),
    status: redact(event.status),
    durationMs: event.durationMs ?? 0,
  };
  appendFileSync(path, `${JSON.stringify(safe)}\n`, {mode: 0o600});
}

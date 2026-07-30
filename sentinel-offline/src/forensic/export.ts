import {mkdirSync, writeFileSync} from "node:fs";
import {dirname} from "node:path";
import type {TimelineEvent} from "./timeline.js";
export function exportTechnicalReport(path: string, caseId: string, events: TimelineEvent[]): void {
  mkdirSync(dirname(path), {recursive: true, mode: 0o700});
  const report = {caseId, generatedAt: new Date().toISOString(), attribution: "No determinada", events};
  writeFileSync(path, JSON.stringify(report, null, 2), {mode: 0o600, flag: "wx"});
}

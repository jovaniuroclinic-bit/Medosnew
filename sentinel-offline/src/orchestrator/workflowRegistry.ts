import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";

export type WorkflowRecord = {
  id: string; name: string; active: false; nodes: Array<{type: string}>;
  medos: {owner: "OWNER"; riskLevel: string; approvalRequired: boolean;
    credentials: string[]; network: boolean; rollback: string; dataClassification: string};
};
const SECRET = /(?:gh[pousr]_|github_pat_|cfat_|Bearer\s+|BEGIN [A-Z ]*PRIVATE KEY)/iu;
export function workflowHash(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
export function validateWorkflow(path: string, allowed: Set<string>): WorkflowRecord {
  const raw = readFileSync(path, "utf8");
  if (SECRET.test(raw)) throw new Error("WORKFLOW_SECRET");
  const workflow = JSON.parse(raw) as WorkflowRecord;
  if (workflow.active !== false || !workflow.medos?.approvalRequired) throw new Error("WORKFLOW_UNSAFE");
  if (workflow.nodes.some((node) => !allowed.has(node.type))) throw new Error("NODE_PROHIBITED");
  return workflow;
}

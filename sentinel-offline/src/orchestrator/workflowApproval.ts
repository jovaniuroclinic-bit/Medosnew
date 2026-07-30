import {evaluateAction, type ToolClass} from "../policyEngine.js";

export function requireWorkflowApproval(workflowId: string, riskLevel: ToolClass, confirmation?: string) {
  return evaluateAction({
    tool: `workflow:${workflowId}`,
    arguments: {},
    reason: confirmation?.trim() || `Autorizar workflow ${workflowId}`,
    scope: `Workflow ${workflowId}`,
    rollback: "Detener ejecución; no persiste payload.",
  }, riskLevel);
}

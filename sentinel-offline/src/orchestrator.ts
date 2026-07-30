import {randomUUID} from "node:crypto";
import {requestApproval} from "./approvals.js";
import {saveCheckpoint} from "./checkpoint.js";
import {evaluateAction, type ProposedAction} from "./policyEngine.js";
import {redact} from "./redaction.js";
import type {ToolRegistry, ToolResult} from "./toolRegistry.js";

export class Orchestrator {
  constructor(private readonly registry: ToolRegistry, private readonly checkpointPath: string, private readonly assisted = false) {}
  async act(action: ProposedAction): Promise<ToolResult> {
    const tool = this.registry.get(action.tool);
    if (!tool) return {ok: false, summary: "Herramienta no registrada"};
    const decision = evaluateAction(action, tool.classification);
    if (!decision.allowed) return {ok: false, summary: decision.reason};
    const auto = this.assisted && decision.classification === "READ_ONLY";
    if (!auto && !(await requestApproval(`${tool.description}: ${redact(action.reason)}`, decision))) {
      return {ok: false, summary: "Acción cancelada; no se realizaron cambios"};
    }
    const result = await tool.execute(action.arguments);
    saveCheckpoint(this.checkpointPath, {
      id: randomUUID(), timestamp: new Date().toISOString(), state: result.ok ? "HECHO" : "PENDIENTE",
      nextStep: result.ok ? "Volver al menú" : "Revisar el error", completed: result.ok ? [action.tool] : [],
    });
    return {...result, summary: redact(result.summary)};
  }
}

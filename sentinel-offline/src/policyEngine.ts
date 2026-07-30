export type ToolClass = "READ_ONLY" | "REVERSIBLE" | "DESTRUCTIVE" | "PROHIBITED";
export type ProposedAction = {tool: string; arguments: Record<string, unknown>; reason: string};
export type PolicyDecision = {allowed: boolean; classification: ToolClass; confirmation: "none" | "brief" | "full"; reason: string};

const prohibited = new Set([
  "factoryReset", "credentialExtraction", "readOtherApps", "publicListener",
  "thirdPartyScan", "uploadEvidence", "bootloader", "disableEncryption", "arbitraryShell",
]);

export function evaluateAction(action: ProposedAction, toolClass?: ToolClass): PolicyDecision {
  if (prohibited.has(action.tool) || toolClass === "PROHIBITED") {
    return {allowed: false, classification: "PROHIBITED", confirmation: "full", reason: "Acción prohibida por política local"};
  }
  const classification = toolClass ?? "READ_ONLY";
  return {
    allowed: true,
    classification,
    confirmation: classification === "READ_ONLY" ? "none" : classification === "REVERSIBLE" ? "brief" : "full",
    reason: classification === "DESTRUCTIVE" ? "Requiere rollback visible y confirmación completa" : "Herramienta registrada",
  };
}

export type ToolClass =
  | "READ_ONLY"
  | "LOW_RISK"
  | "REVERSIBLE"
  | "ACCOUNT_ACTION"
  | "HIGH_RISK"
  | "DESTRUCTIVE"
  | "PROHIBITED";

export type ProposedAction = {
  tool: string;
  arguments: Record<string, unknown>;
  reason: string;
  scope?: string;
  rollback?: string;
};

export type PolicyDecision = {
  allowed: boolean;
  classification: ToolClass;
  confirmation: "none" | "brief" | "reauth";
  reason: string;
  exactPhrase?: string;
};

const prohibited = new Set([
  "factoryReset", "credentialExtraction", "readOtherApps", "publicListener",
  "thirdPartyScan", "uploadEvidence", "bootloader", "disableEncryption",
  "arbitraryShell", "bypassMfa", "surveillance", "hackBack",
]);

export function evaluateAction(action: ProposedAction, toolClass: ToolClass = "READ_ONLY"): PolicyDecision {
  if (prohibited.has(action.tool) || toolClass === "PROHIBITED") {
    return {allowed: false, classification: "PROHIBITED", confirmation: "reauth", reason: "Acción prohibida por política local"};
  }
  const critical = toolClass === "HIGH_RISK" || toolClass === "DESTRUCTIVE";
  if (critical && (!action.scope?.trim() || !action.rollback?.trim())) {
    return {allowed: false, classification: toolClass, confirmation: "reauth", reason: "Falta alcance o rollback verificable"};
  }
  return {
    allowed: true,
    classification: toolClass,
    confirmation: toolClass === "READ_ONLY" ? "none" : critical ? "reauth" : "brief",
    reason: critical ? "Requiere reautenticación, alcance y rollback" : "Herramienta registrada",
    ...(critical ? {exactPhrase: `CONFIRMAR ${action.tool}`} : {}),
  };
}

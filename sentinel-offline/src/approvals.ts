import {createInterface} from "node:readline/promises";
import {stdin, stdout} from "node:process";
import type {PolicyDecision} from "./policyEngine.js";

export function approvalMatches(answer: string, decision: PolicyDecision): boolean {
  const normalized = answer.trim().toLocaleLowerCase("es");
  if (decision.confirmation === "none") return true;
  if (decision.confirmation === "reauth") return normalized === decision.exactPhrase?.toLocaleLowerCase("es");
  return normalized === "sí" || normalized === "si";
}

export async function requestApproval(summary: string, decision: PolicyDecision): Promise<boolean> {
  if (!decision.allowed) return false;
  if (decision.confirmation === "none") return true;
  const prompt = decision.confirmation === "reauth"
    ? `ACCIÓN CRÍTICA: ${summary}\nEscribe ${decision.exactPhrase}: `
    : `${summary}\n¿sí/no? `;
  const rl = createInterface({input: stdin, output: stdout});
  const answer = await rl.question(prompt);
  rl.close();
  return approvalMatches(answer, decision);
}

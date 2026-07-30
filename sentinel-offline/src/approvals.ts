import {createInterface} from "node:readline/promises";
import {stdin, stdout} from "node:process";
import type {PolicyDecision} from "./policyEngine.js";

export async function requestApproval(summary: string, decision: PolicyDecision): Promise<boolean> {
  if (!decision.allowed) return false;
  if (decision.confirmation === "none") return true;
  const prompt = decision.confirmation === "full" ? `CONFIRMA: ${summary}\nEscribe CONFIRMAR: ` : `${summary}\n¿sí/no? `;
  const rl = createInterface({input: stdin, output: stdout});
  const answer = (await rl.question(prompt)).trim().toLocaleLowerCase("es");
  rl.close();
  return decision.confirmation === "full" ? answer === "confirmar" : answer === "sí" || answer === "si";
}

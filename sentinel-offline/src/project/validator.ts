import {PROJECT_STATES, type Project, type Task} from "./types.js";
const safeId = /^[a-z0-9][a-z0-9_-]{2,63}$/u;
function safeText(value: unknown, label: string, maximum = 500): string {
  if (typeof value !== "string") throw new Error(`${label} inválido`);
  const normalized = value.normalize("NFC").trim();
  if (!normalized || normalized.length > maximum || [...normalized].some((character) => (character.codePointAt(0) ?? 0) < 32)) {
    throw new Error(`${label} inválido`);
  }
  return normalized;
}
export function validateProject(input: unknown): Project {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Proyecto inválido");
  const value = input as Record<string, unknown>;
  const allowed = new Set(["projectId","owner","objective","scope","exclusions","status","priority","risk","dependency","start","deadline","estimateMinutes","evidence","nextAction","blocker","checkpoint","completionCriteria","createdAt","updatedAt"]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new Error(`Campo desconocido: ${key}`);
  const projectId = safeText(value.projectId, "projectId", 64);
  if (!safeId.test(projectId)) throw new Error("projectId inválido");
  const status = String(value.status);
  if (!PROJECT_STATES.includes(status as Project["status"])) throw new Error("Estado inválido");
  const priority = Number(value.priority);
  const estimateMinutes = Number(value.estimateMinutes);
  if (!Number.isInteger(priority) || priority < 1 || priority > 5) throw new Error("Prioridad inválida");
  if (!Number.isInteger(estimateMinutes) || estimateMinutes < 5 || estimateMinutes > 100_000) throw new Error("Estimación inválida");
  const strings = (item: unknown, label: string) => {
    if (!Array.isArray(item) || item.length > 50) throw new Error(`${label} inválido`);
    return item.map((entry) => safeText(entry, label, 200));
  };
  const start = safeText(value.start, "Inicio", 30); const deadline = safeText(value.deadline, "Fecha límite", 30);
  if (Date.parse(deadline) < Date.parse(start)) throw new Error("Fecha límite anterior al inicio");
  return {
    projectId, owner: safeText(value.owner, "Responsable", 120), objective: safeText(value.objective, "Objetivo"),
    scope: safeText(value.scope, "Alcance"), exclusions: strings(value.exclusions, "Exclusiones"),
    status: status as Project["status"], priority: priority as Project["priority"],
    risk: safeText(value.risk, "Riesgo", 300), dependency: strings(value.dependency, "Dependencia"),
    start, deadline, estimateMinutes, evidence: strings(value.evidence, "Evidencia"),
    nextAction: safeText(value.nextAction, "Siguiente acción", 240),
    blocker: typeof value.blocker === "string" ? value.blocker.normalize("NFC").trim().slice(0, 240) : "",
    checkpoint: safeText(value.checkpoint, "Checkpoint", 240),
    completionCriteria: safeText(value.completionCriteria, "Criterio de cierre", 500),
    createdAt: safeText(value.createdAt, "Creación", 30), updatedAt: safeText(value.updatedAt, "Actualización", 30),
  };
}
export function validateTask(input: unknown): Task {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Tarea inválida");
  const value = input as Task;
  if (!safeId.test(value.id) || !safeId.test(value.projectId)) throw new Error("ID de tarea inválido");
  if (value.estimateMinutes < 5 || value.estimateMinutes > 20) throw new Error("Modo TDAH requiere pasos de 5–20 minutos");
  safeText(value.title, "Tarea", 160); safeText(value.firstStep, "Primer paso", 240);
  return structuredClone(value);
}

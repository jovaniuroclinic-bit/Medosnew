import type {Project, Task} from "./types.js";
export type ProjectFinding = {code: string; projectId: string; message: string};
export function analyzePortfolio(projects: Project[], tasks: Task[]): ProjectFinding[] {
  const findings: ProjectFinding[] = [];
  for (const project of projects) {
    if (!project.completionCriteria.trim()) findings.push({code: "NO_COMPLETION_CRITERIA", projectId: project.projectId, message: "Falta criterio de cierre"});
    if (Date.parse(project.deadline) < Date.parse(project.start)) findings.push({code: "IMPOSSIBLE_DATE", projectId: project.projectId, message: "Fecha imposible"});
    if (project.risk.trim() && project.owner.trim() === "") findings.push({code: "RISK_WITHOUT_OWNER", projectId: project.projectId, message: "Riesgo sin responsable"});
    if (project.status === "ACTIVE" && !tasks.some((task) => task.projectId === project.projectId && task.status !== "COMPLETED")) findings.push({code: "ABANDONED", projectId: project.projectId, message: "Proyecto activo sin siguiente tarea"});
  }
  return findings;
}
export function nextTdahTask(tasks: Task[]): Task | undefined {
  return tasks.filter((task) => ["READY", "ACTIVE"].includes(task.status)).sort((a, b) => a.estimateMinutes - b.estimateMinutes)[0];
}

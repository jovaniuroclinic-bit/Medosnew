export const PROJECT_STATES = ["IDEA", "PLANNED", "READY", "ACTIVE", "WAITING", "BLOCKED", "REVIEW", "COMPLETED", "ARCHIVED"] as const;
export type ProjectState = (typeof PROJECT_STATES)[number];
export type Project = {
  projectId: string;
  owner: string;
  objective: string;
  scope: string;
  exclusions: string[];
  status: ProjectState;
  priority: 1 | 2 | 3 | 4 | 5;
  risk: string;
  dependency: string[];
  start: string;
  deadline: string;
  estimateMinutes: number;
  evidence: string[];
  nextAction: string;
  blocker: string;
  checkpoint: string;
  completionCriteria: string;
  createdAt: string;
  updatedAt: string;
};
export type Task = {
  id: string; projectId: string; title: string; status: ProjectState;
  estimateMinutes: number; firstStep: string; dependency: string[];
  checkpoint: string; updatedAt: string;
};

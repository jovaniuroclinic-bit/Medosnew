import {mkdirSync, readFileSync, renameSync, writeFileSync} from "node:fs";
import {dirname} from "node:path";
import {validateProject, validateTask} from "./validator.js";
import type {Project, Task} from "./types.js";
type Portfolio = {version: 1; projects: Project[]; tasks: Task[]};
const empty = (): Portfolio => ({version: 1, projects: [], tasks: []});
export class ProjectStore {
  constructor(private readonly path: string) {}
  read(): Portfolio {
    try {
      const parsed = JSON.parse(readFileSync(this.path, "utf8")) as Portfolio;
      return {version: 1, projects: parsed.projects.map(validateProject), tasks: parsed.tasks.map(validateTask)};
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return empty();
      throw error;
    }
  }
  save(portfolio: Portfolio): void {
    mkdirSync(dirname(this.path), {recursive: true, mode: 0o700});
    const temporary = `${this.path}.tmp`;
    writeFileSync(temporary, JSON.stringify(portfolio, null, 2), {mode: 0o600});
    renameSync(temporary, this.path);
  }
  addProject(project: unknown): Portfolio {
    const portfolio = this.read(); const valid = validateProject(project);
    if (portfolio.projects.some((item) => item.projectId === valid.projectId || item.objective.toLocaleLowerCase("es") === valid.objective.toLocaleLowerCase("es"))) {
      throw new Error("Proyecto duplicado");
    }
    portfolio.projects.push(valid); this.save(portfolio); return portfolio;
  }
  addTask(task: Task): Portfolio {
    const portfolio = this.read(); const valid = validateTask(task);
    if (!portfolio.projects.some((item) => item.projectId === valid.projectId)) throw new Error("Proyecto inexistente");
    if (portfolio.tasks.some((item) => item.id === valid.id || (item.projectId === valid.projectId && item.title.toLocaleLowerCase("es") === valid.title.toLocaleLowerCase("es")))) throw new Error("Tarea duplicada");
    portfolio.tasks.push(valid); this.save(portfolio); return portfolio;
  }
}

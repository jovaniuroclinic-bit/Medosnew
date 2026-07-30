import type {ToolClass} from "./policyEngine.js";
export type ToolResult = {ok: boolean; summary: string; details?: unknown};
export type ToolDefinition = {
  name: string; classification: ToolClass; description: string;
  execute: (args: Record<string, unknown>) => Promise<ToolResult>;
};
export class ToolRegistry {
  readonly #tools = new Map<string, ToolDefinition>();
  register(tool: ToolDefinition): void {
    if (this.#tools.has(tool.name)) throw new Error(`Herramienta duplicada: ${tool.name}`);
    this.#tools.set(tool.name, tool);
  }
  get(name: string): ToolDefinition | undefined { return this.#tools.get(name); }
  list(): Omit<ToolDefinition, "execute">[] {
    return [...this.#tools.values()].map(({execute: _execute, ...metadata}) => metadata);
  }
}

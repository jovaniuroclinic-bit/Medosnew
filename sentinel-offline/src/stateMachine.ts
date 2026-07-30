export type SentinelState =
  | "IDLE"
  | "PLANNING"
  | "WAITING_APPROVAL"
  | "RUNNING"
  | "PAUSED"
  | "BLOCKED"
  | "COMPLETED"
  | "FAILED"
  | "ROLLING_BACK";

const transitions: Record<SentinelState, SentinelState[]> = {
  IDLE: ["PLANNING"],
  PLANNING: ["WAITING_APPROVAL", "RUNNING", "BLOCKED", "FAILED"],
  WAITING_APPROVAL: ["RUNNING", "PAUSED", "BLOCKED"],
  RUNNING: ["PAUSED", "BLOCKED", "COMPLETED", "FAILED", "ROLLING_BACK"],
  PAUSED: ["RUNNING", "ROLLING_BACK", "FAILED"],
  BLOCKED: ["PLANNING", "PAUSED", "FAILED"],
  COMPLETED: ["IDLE"],
  FAILED: ["PLANNING", "ROLLING_BACK", "IDLE"],
  ROLLING_BACK: ["COMPLETED", "FAILED"],
};

export function transition(from: SentinelState, to: SentinelState): SentinelState {
  if (!transitions[from].includes(to)) throw new Error(`Transición no permitida: ${from} → ${to}`);
  return to;
}

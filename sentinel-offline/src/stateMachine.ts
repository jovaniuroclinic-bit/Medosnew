export type SentinelState = "IDLE" | "PROPOSED" | "APPROVED" | "RUNNING" | "CHECKPOINTED" | "STOPPED";
const transitions: Record<SentinelState, SentinelState[]> = {
  IDLE: ["PROPOSED", "STOPPED"], PROPOSED: ["APPROVED", "STOPPED"],
  APPROVED: ["RUNNING", "STOPPED"], RUNNING: ["CHECKPOINTED", "STOPPED"],
  CHECKPOINTED: ["IDLE", "STOPPED"], STOPPED: ["IDLE"],
};
export function transition(from: SentinelState, to: SentinelState): SentinelState {
  if (!transitions[from].includes(to)) throw new Error(`Transición no permitida: ${from} → ${to}`);
  return to;
}

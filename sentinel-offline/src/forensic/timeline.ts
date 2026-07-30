export type TimelineEvent = {timestamp: string; source: string; action: string; sha256?: string};
export function buildTimeline(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

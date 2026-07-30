export type Priority = "routine" | "recommended" | "priority" | "urgent";

export interface AssessmentResult {
  score?: number;
  category: string;
  priority: Priority;
  explanation: string;
}

export interface RedFlag {
  id: string;
  label: string;
}

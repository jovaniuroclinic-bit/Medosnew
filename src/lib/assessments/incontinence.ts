import type { AssessmentResult } from "./types";

export type LeakagePattern = "Esfuerzo" | "Urgencia" | "Mixto" | "Indeterminado";

export function determineLeakagePattern(effort: number, urgency: number): LeakagePattern {
  if (effort >= 2 && urgency >= 2) return "Mixto";
  if (effort >= 2) return "Esfuerzo";
  if (urgency >= 2) return "Urgencia";
  return "Indeterminado";
}

export function scoreIncontinence(answers: Array<number | undefined>): AssessmentResult {
  if (answers.length !== 7 || answers.some((value) => value === undefined)) {
    throw new Error("La evaluación está incompleta.");
  }
  if (answers.some((value) => !Number.isInteger(value) || Number(value) < 0 || Number(value) > 3)) {
    throw new RangeError("Respuesta fuera de rango.");
  }
  const score = answers.reduce<number>((total, value) => total + Number(value), 0);
  if (score <= 6) {
    return {
      score,
      category: "Impacto bajo",
      priority: "routine",
      explanation: "El impacto referido es bajo; vigile cambios y considere sus antecedentes.",
    };
  }
  if (score <= 14) {
    return {
      score,
      category: "Impacto moderado",
      priority: "recommended",
      explanation: "Conviene valoración médica para identificar el patrón y las posibles causas.",
    };
  }
  return {
    score,
    category: "Impacto alto",
    priority: "priority",
    explanation: "Se recomienda valoración prioritaria por la interferencia reportada.",
  };
}

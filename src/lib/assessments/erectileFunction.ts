import type { AssessmentResult } from "./types";

export function scoreErectileFunction(answers: Array<number | undefined>): AssessmentResult {
  if (answers.length !== 10 || answers.some((value) => value === undefined)) {
    throw new Error("La evaluación está incompleta.");
  }
  if (answers.some((value) => !Number.isInteger(value) || Number(value) < 0 || Number(value) > 3)) {
    throw new RangeError("Respuesta fuera de rango.");
  }
  const score = answers.reduce<number>((total, value) => total + Number(value), 0);
  if (score <= 4) {
    return {
      score,
      category: "Sin señales relevantes",
      priority: "routine",
      explanation: "No se identifican señales relevantes; el resultado requiere correlación clínica.",
    };
  }
  if (score <= 10) {
    return {
      score,
      category: "Señales leves",
      priority: "recommended",
      explanation: "Conviene revisar evolución, salud general y factores asociados.",
    };
  }
  if (score <= 19) {
    return {
      score,
      category: "Señales moderadas",
      priority: "recommended",
      explanation: "Conviene valoración médica integral de salud sexual y factores asociados.",
    };
  }
  return {
    score,
    category: "Señales importantes",
    priority: "priority",
    explanation: "Se recomienda valoración médica prioritaria para correlación clínica.",
  };
}

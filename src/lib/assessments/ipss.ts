import type { AssessmentResult } from "./types";

export const IPSS_QUESTIONS = [
  "¿Con qué frecuencia ha sentido que su vejiga no se vació por completo al terminar de orinar?",
  "¿Con qué frecuencia ha necesitado orinar de nuevo antes de dos horas?",
  "¿Con qué frecuencia el flujo de orina se ha detenido y reiniciado varias veces?",
  "¿Con qué frecuencia le ha resultado difícil posponer la necesidad de orinar?",
  "¿Con qué frecuencia ha notado un chorro urinario débil?",
  "¿Con qué frecuencia ha tenido que pujar o hacer esfuerzo para comenzar a orinar?",
  "¿Cuántas veces suele levantarse a orinar desde que se acuesta hasta que se levanta por la mañana?",
];

export const IPSS_OPTIONS = [
  "Nunca",
  "Menos de una vez de cada cinco",
  "Menos de la mitad de las veces",
  "Aproximadamente la mitad de las veces",
  "Más de la mitad de las veces",
  "Casi siempre",
];

export function scoreIpSS(answers: Array<number | undefined>): AssessmentResult {
  if (answers.length !== 7 || answers.some((value) => value === undefined)) {
    throw new Error("Se requieren las siete respuestas sintomáticas.");
  }
  if (answers.some((value) => !Number.isInteger(value) || Number(value) < 0 || Number(value) > 5)) {
    throw new RangeError("Cada respuesta debe estar entre 0 y 5.");
  }
  const score = answers.reduce<number>((total, value) => total + Number(value), 0);
  if (score === 0) {
    return {
      score,
      category: "Sin síntomas relevantes",
      priority: "routine",
      explanation:
        "No se identifican síntomas relevantes en este tamizaje. Considere su edad, calidad de vida y antecedentes.",
    };
  }
  if (score <= 7) {
    return {
      score,
      category: "Síntomas leves",
      priority: "routine",
      explanation:
        "Puede ser razonable mantener vigilancia y medidas generales, siempre considerando edad, calidad de vida y antecedentes.",
    };
  }
  if (score <= 19) {
    return {
      score,
      category: "Síntomas moderados",
      priority: "recommended",
      explanation:
        "Conviene realizar valoración urológica para identificar causas y opciones de manejo.",
    };
  }
  return {
    score,
    category: "Síntomas severos",
    priority: "priority",
    explanation: "Se recomienda valoración urológica prioritaria.",
  };
}

export const FUNCTIONAL_DOMAINS = [
  "Salud metabólica",
  "Sueño",
  "Actividad física",
  "Salud sexual",
  "Salud urinaria",
  "Factores cardiovasculares",
] as const;

export type FunctionalDomain = (typeof FUNCTIONAL_DOMAINS)[number];

export interface FunctionalProfile {
  category: string;
  diagnostic: false;
  domains: Record<FunctionalDomain, number>;
}

export function buildFunctionalProfile(values: Record<string, number | undefined>): FunctionalProfile {
  const get = (...keys: string[]) => {
    const present = keys.map((key) => values[key]).filter((value): value is number => value !== undefined);
    return present.length === 0
      ? 0
      : Math.round((present.reduce((total, value) => total + value, 0) / (present.length * 3)) * 100);
  };
  const domains: Record<FunctionalDomain, number> = {
    "Salud metabólica": get("waist", "diabetes", "lipids", "nutrition"),
    Sueño: get("sleep", "apnea", "energy", "mood"),
    "Actividad física": get("activity"),
    "Salud sexual": get("desire", "morningErections"),
    "Salud urinaria": get("urinary"),
    "Factores cardiovasculares": get("smoking", "bloodPressure", "alcohol", "familyHistory"),
  };
  const average = Object.values(domains).reduce((sum, value) => sum + value, 0) / FUNCTIONAL_DOMAINS.length;
  return {
    category:
      average < 25
        ? "Perfil con pocos factores señalados"
        : average < 55
          ? "Perfil con aspectos por revisar"
          : "Perfil con varios factores por revisar",
    diagnostic: false,
    domains,
  };
}

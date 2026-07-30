import type { RedFlag } from "./types";

export const RED_FLAGS: RedFlag[] = [
  { id: "retention", label: "No puedo orinar." },
  { id: "hematuria", label: "Veo sangre en la orina." },
  { id: "testicular", label: "Tengo dolor testicular súbito." },
  { id: "fever", label: "Tengo fiebre con dolor urinario o lumbar." },
  { id: "severePain", label: "Tengo dolor intenso que no puedo controlar." },
  { id: "priapism", label: "Tengo una erección dolorosa de más de cuatro horas." },
  { id: "neurologic", label: "Perdí fuerza o sensibilidad de forma súbita." },
  {
    id: "cardiovascular",
    label: "Tengo dolor torácico, dificultad para respirar u otros síntomas cardiovasculares.",
  },
  { id: "selfHarm", label: "Tengo ideas de hacerme daño." },
];

export function hasRedFlag(values: Record<string, unknown>): boolean {
  return RED_FLAGS.some(({ id }) => values[id] === true || values[id] === "yes");
}

import type { EmailContent } from "../types.ts";
import { escapeHtml, layout } from "./shared.ts";

interface Input {
  name: string;
  contact: string;
  serviceCategory: string;
  preferredDate?: string;
  preferredTime?: string;
  receivedAt: string;
  requestId: string;
}

export const appointmentClinicTemplate = (input: Input): EmailContent => {
  const lines = [
    `Nombre: ${input.name}`,
    `Contacto: ${input.contact}`,
    `Servicio general: ${input.serviceCategory}`,
    `Fecha preferida: ${input.preferredDate || "No indicada"}`,
    `Hora preferida: ${input.preferredTime || "No indicada"}`,
    `Recibida: ${input.receivedAt}`,
    `Identificador: ${input.requestId}`,
  ];
  return {
    subject: "Nueva solicitud de cita — UROCLINIC",
    text: `${lines.join("\n")}\n\nNo responda solicitando datos clínicos sensibles por correo ordinario.`,
    html: layout(
      "Nueva solicitud de cita",
      `<dl>${lines
        .map((line) => {
          const [label, ...value] = line.split(": ");
          return `<dt style="font-weight:bold">${escapeHtml(label)}</dt><dd style="margin:0 0 12px">${escapeHtml(value.join(": "))}</dd>`;
        })
        .join("")}</dl><p>No responda solicitando datos clínicos sensibles por correo ordinario.</p>`,
    ),
  };
};

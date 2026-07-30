import type { EmailContent } from "../types.ts";
import { escapeHtml, layout } from "./shared.ts";

interface Input {
  name: string;
  contact: string;
  subjectCategory: string;
  message: string;
  receivedAt: string;
  requestId: string;
}

export const contactClinicTemplate = (input: Input): EmailContent => ({
  subject: "Nuevo contacto — UROCLINIC",
  text: `Nombre: ${input.name}\nContacto: ${input.contact}\nAsunto: ${input.subjectCategory}\nMensaje: ${input.message}\nRecibido: ${input.receivedAt}\nIdentificador: ${input.requestId}\n\nNo solicite datos clínicos sensibles por correo ordinario.`,
  html: layout(
    "Nuevo contacto",
    `<p><strong>Nombre:</strong> ${escapeHtml(input.name)}</p><p><strong>Contacto:</strong> ${escapeHtml(input.contact)}</p><p><strong>Asunto:</strong> ${escapeHtml(input.subjectCategory)}</p><p><strong>Mensaje:</strong><br>${escapeHtml(input.message)}</p><p><strong>Identificador:</strong> ${escapeHtml(input.requestId)}</p><p>No solicite datos clínicos sensibles por correo ordinario.</p>`,
  ),
});

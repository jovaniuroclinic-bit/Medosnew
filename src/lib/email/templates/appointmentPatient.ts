import type { EmailContent } from "../types.ts";
import { escapeHtml, layout } from "./shared.ts";

export const appointmentPatientTemplate = (name: string, requestId: string): EmailContent => ({
  subject: "Recibimos su solicitud — UROCLINIC",
  text: `Hola ${name}. Recibimos su solicitud (${requestId}). La cita aún debe confirmarse. Llame o escriba por WhatsApp al +52 871 275 6523. Para urgencias, llame al 911. Aviso de privacidad: https://drjovaniurologo.org/privacidad`,
  html: layout(
    "Recibimos su solicitud",
    `<p>Hola ${escapeHtml(name)}.</p><p>Recibimos su solicitud con identificador <strong>${escapeHtml(requestId)}</strong>. La cita aún debe confirmarse.</p><p>Llame o escriba por WhatsApp al <a href="tel:+528712756523">+52 871 275 6523</a>.</p><p>Para urgencias, llame al 911.</p><p><a href="https://drjovaniurologo.org/privacidad">Aviso de privacidad</a></p>`,
  ),
});

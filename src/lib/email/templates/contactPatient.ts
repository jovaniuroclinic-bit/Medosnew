import type { EmailContent } from "../types.ts";
import { escapeHtml, layout } from "./shared.ts";

export const contactPatientTemplate = (name: string, requestId: string): EmailContent => ({
  subject: "Recibimos su mensaje — UROCLINIC",
  text: `Hola ${name}. Recibimos su mensaje (${requestId}). Nuestro equipo dará seguimiento. No envíe información médica sensible por correo. Para urgencias, llame al 911. https://drjovaniurologo.org/privacidad`,
  html: layout(
    "Recibimos su mensaje",
    `<p>Hola ${escapeHtml(name)}.</p><p>Recibimos su mensaje con identificador <strong>${escapeHtml(requestId)}</strong>. Nuestro equipo dará seguimiento.</p><p>No envíe información médica sensible por correo. Para urgencias, llame al 911.</p><p><a href="https://drjovaniurologo.org/privacidad">Aviso de privacidad</a></p>`,
  ),
});

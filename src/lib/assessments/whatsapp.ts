export const CLINIC_PHONE = "528712756523";
export const PHONE_HREF = `tel:+${CLINIC_PHONE}`;

export function assessmentWhatsAppHref(name: string, category: string): string {
  const message = `Hola Dr. Jovani. Realicé la evaluación de ${name} en UROCLINIC. Mi categoría orientativa fue ${category}. Deseo agendar una valoración.`;
  return `https://wa.me/${CLINIC_PHONE}?text=${encodeURIComponent(message)}`;
}

export function genericWhatsAppHref(): string {
  return `https://wa.me/${CLINIC_PHONE}?text=${encodeURIComponent(
    "Hola Dr. Jovani. Realicé una autoevaluación en UROCLINIC y deseo agendar una valoración.",
  )}`;
}

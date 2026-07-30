import { CloudflareMailProvider } from "../lib/email/cloudflareProvider.ts";
import { appointmentClinicTemplate } from "../lib/email/templates/appointmentClinic.ts";
import { appointmentPatientTemplate } from "../lib/email/templates/appointmentPatient.ts";
import { contactClinicTemplate } from "../lib/email/templates/contactClinic.ts";
import { contactPatientTemplate } from "../lib/email/templates/contactPatient.ts";
import type { EmailContent } from "../lib/email/types.ts";

export interface FormEnv {
  EMAIL?: { send(message: EmailMessage): Promise<void> };
  MAIL_FROM?: string;
  MAIL_TO_CITAS?: string;
  MAIL_TO_CONTACTO?: string;
  MAIL_TO_PRIVACIDAD?: string;
  MAIL_REPLY_TO?: string;
  FORM_HMAC_SECRET?: string;
}

type Kind = "appointment" | "contact";
type Payload = Record<string, unknown>;
const allowed = {
  appointment: new Set(["name", "phone", "email", "preferredDate", "preferredTime", "serviceCategory", "consent", "honeypot", "submissionStartedAt"]),
  contact: new Set(["name", "phone", "email", "subjectCategory", "message", "consent", "honeypot", "submissionStartedAt"]),
};

const response = (body: unknown, status: number, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", ...headers },
  });
const clean = (value: unknown, max: number) =>
  [...String(value ?? "").normalize("NFKC")]
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join("")
    .trim()
    .slice(0, max);
const validEmail = (value: string) => value === "" || /^[^\s@]{1,64}@[^\s@]{1,190}$/.test(value);
const validPhone = (value: string) => /^\d{10,15}$/.test(value);

const parse = async (request: Request): Promise<Payload | Response> => {
  if (request.method !== "POST") return response({ accepted: false, error: "method_not_allowed" }, 405, { allow: "POST" });
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) return response({ accepted: false, error: "origin_not_allowed" }, 403);
    } catch {
      return response({ accepted: false, error: "origin_not_allowed" }, 403);
    }
  }
  if (request.headers.get("content-type")?.split(";", 1)[0].toLowerCase() !== "application/json") {
    return response({ accepted: false, error: "unsupported_media_type" }, 415);
  }
  if (Number(request.headers.get("content-length") ?? "0") > 16_384) {
    return response({ accepted: false, error: "payload_too_large" }, 413);
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 16_384) return response({ accepted: false, error: "payload_too_large" }, 413);
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid");
    return value;
  } catch {
    return response({ accepted: false, error: "invalid_json" }, 400);
  }
};

export const handleForm = async (request: Request, env: FormEnv, kind: Kind, now = Date.now()) => {
  const payload = await parse(request);
  if (payload instanceof Response) return payload;
  if (Object.keys(payload).some((key) => !allowed[kind].has(key))) return response({ accepted: false, error: "unknown_field" }, 422);
  if (clean(payload.honeypot, 200)) return response({ accepted: true, requestId: "filtered" }, 202);
  const startedAt = Number(payload.submissionStartedAt);
  if (!Number.isFinite(startedAt) || now - startedAt < 3_000 || now - startedAt > 7_200_000) {
    return response({ accepted: false, error: "invalid_submission_timing" }, 422);
  }

  const name = clean(payload.name, 100);
  const phone = clean(payload.phone, 20).replace(/\D/g, "");
  const email = clean(payload.email, 254).toLowerCase();
  if (name.length < 3 || payload.consent !== true || (!phone && !email) || (phone && !validPhone(phone)) || !validEmail(email)) {
    return response({ accepted: false, error: "validation_failed" }, 422);
  }

  const requestId = `medos-${crypto.randomUUID()}`;
  const receivedAt = new Date(now).toISOString();
  const contact = [phone, email].filter(Boolean).join(" · ");
  let clinic: EmailContent;
  let patient: EmailContent;
  if (kind === "appointment") {
    const serviceCategory = clean(payload.serviceCategory, 80);
    if (!serviceCategory) return response({ accepted: false, error: "validation_failed" }, 422);
    clinic = appointmentClinicTemplate({
      name, contact, serviceCategory,
      preferredDate: clean(payload.preferredDate, 10),
      preferredTime: clean(payload.preferredTime, 8),
      receivedAt, requestId,
    });
    patient = appointmentPatientTemplate(name, requestId);
  } else {
    const subjectCategory = clean(payload.subjectCategory, 80);
    const message = clean(payload.message, 800);
    if (!subjectCategory || message.length < 2 || /<[^>]+>/.test(message) || (message.match(/https?:\/\/|www\./gi) ?? []).length > 1) {
      return response({ accepted: false, error: "validation_failed" }, 422);
    }
    clinic = contactClinicTemplate({ name, contact, subjectCategory, message, receivedAt, requestId });
    patient = contactPatientTemplate(name, requestId);
  }

  const destination = kind === "appointment" ? env.MAIL_TO_CITAS : env.MAIL_TO_CONTACTO;
  if (!destination || !env.MAIL_FROM || !env.EMAIL) {
    console.warn(JSON.stringify({ event: "mail_not_configured", requestId, kind }));
    return response({ accepted: false, error: "service_unavailable" }, 503);
  }

  const provider = new CloudflareMailProvider(env.EMAIL);
  const began = Date.now();
  try {
    const clinicResult = await Promise.race([
      provider.send({ ...clinic, from: env.MAIL_FROM, to: destination, replyTo: env.MAIL_REPLY_TO }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("mail_timeout")), 8_000)),
    ]);
    if (!clinicResult.ok) throw new Error(clinicResult.code);
    let confirmation = "not_requested";
    if (email) {
      try {
        const result = await provider.send({ ...patient, from: env.MAIL_FROM, to: email, replyTo: env.MAIL_REPLY_TO });
        confirmation = result.ok ? "sent" : result.code;
      } catch {
        confirmation = "failed";
      }
    }
    console.log(JSON.stringify({ event: "form_delivery", requestId, kind, status: "sent", confirmation, latencyMs: Date.now() - began }));
    return response({ accepted: true, requestId, confirmation }, 202);
  } catch (error) {
    console.error(JSON.stringify({ event: "form_delivery", requestId, kind, status: "failed", code: error instanceof Error ? error.message : "provider_error", latencyMs: Date.now() - began }));
    return response({ accepted: false, error: "service_unavailable", requestId }, 503);
  }
};

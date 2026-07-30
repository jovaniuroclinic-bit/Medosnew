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
  MAIL_TO_SOPORTE?: string;
  MAIL_REPLY_TO?: string;
  FORM_HMAC_SECRET?: string;
  TURNSTILE_SECRET_KEY?: string;
}

type Kind = "appointment" | "contact";
type Payload = Record<string, unknown>;
const allowed = {
  appointment: new Set(["name", "phone", "email", "preferredDate", "preferredTime", "serviceCategory", "consent", "honeypot", "submissionStartedAt", "turnstileToken"]),
  contact: new Set(["name", "phone", "email", "subjectCategory", "message", "consent", "honeypot", "submissionStartedAt", "turnstileToken"]),
};
const BODY_LIMIT = 16_384;
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 5;
const REPLAY_TTL_MS = 15 * 60_000;
const rateWindows = new Map<string, { count: number; startedAt: number }>();
const replayReservations = new Map<string, number>();

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
const validEmail = (value: string) => value === "" || /^[^\s@\r\n]{1,64}@[^\s@\r\n]{1,190}$/.test(value);
const validPhone = (value: string) => /^\d{10,15}$/.test(value);
const unsafeText = (value: string) => /[<>\r\n]/.test(value);
const hasControlInput = (value: unknown) => [...String(value ?? "")].some((character) => {
  const code = character.codePointAt(0) ?? 0;
  return code < 32 || (code >= 127 && code <= 159) || (code >= 0x202a && code <= 0x202e) || (code >= 0x2066 && code <= 0x2069);
});

const fingerprint = async (secret: string, value: string) => {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))), (byte) => byte.toString(16).padStart(2, "0")).join("");
};
const prune = (now: number) => {
  for (const [key, value] of rateWindows) if (now - value.startedAt > RATE_WINDOW_MS) rateWindows.delete(key);
  for (const [key, expiresAt] of replayReservations) if (expiresAt <= now) replayReservations.delete(key);
};
const consumeRate = (key: string, now: number) => {
  const current = rateWindows.get(key);
  if (!current || now - current.startedAt > RATE_WINDOW_MS) {
    rateWindows.set(key, { count: 1, startedAt: now });
    return true;
  }
  current.count += 1;
  return current.count <= RATE_MAX;
};

const verifyTurnstile = async (request: Request, secret: string, token: string) => {
  if (!token || token.length > 2048) return false;
  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  const remoteIp = request.headers.get("cf-connecting-ip");
  if (remoteIp) body.set("remoteip", remoteIp);
  try {
    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, signal: AbortSignal.timeout(5_000) });
    if (!result.ok) return false;
    const verification = (await result.json()) as { success?: boolean; hostname?: string };
    const hostname = new URL(request.url).hostname;
    return verification.success === true && verification.hostname === hostname;
  } catch {
    return false;
  }
};

const parse = async (request: Request): Promise<Payload | Response> => {
  if (request.method !== "POST") return response({ accepted: false, error: "method_not_allowed" }, 405, { allow: "POST" });
  const origin = request.headers.get("origin");
  try {
    if (!origin || new URL(origin).host !== new URL(request.url).host) return response({ accepted: false, error: "origin_not_allowed" }, 403);
  } catch {
    return response({ accepted: false, error: "origin_not_allowed" }, 403);
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return response({ accepted: false, error: "origin_not_allowed" }, 403);
  if (request.headers.get("content-type")?.split(";", 1)[0].toLowerCase() !== "application/json") return response({ accepted: false, error: "unsupported_media_type" }, 415);
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(contentLength) || contentLength < 0 || contentLength > BODY_LIMIT) return response({ accepted: false, error: "payload_too_large" }, 413);
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > BODY_LIMIT) return response({ accepted: false, error: "payload_too_large" }, 413);
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid");
    return value;
  } catch {
    return response({ accepted: false, error: "invalid_json" }, 400);
  }
};

export const handleForm = async (request: Request, env: FormEnv, kind: Kind, now = Date.now()) => {
  prune(now);
  const payload = await parse(request);
  if (payload instanceof Response) return payload;
  if (Object.keys(payload).some((key) => !allowed[kind].has(key))) return response({ accepted: false, error: "invalid_request" }, 400);
  if (clean(payload.honeypot, 200)) return response({ accepted: true, requestId: "filtered" }, 202);
  const startedAt = Number(payload.submissionStartedAt);
  if (!Number.isFinite(startedAt) || now - startedAt < 3_000 || now - startedAt > 7_200_000) return response({ accepted: false, error: "invalid_request" }, 400);

  if ([payload.name, payload.email, payload.phone].some(hasControlInput)) return response({ accepted: false, error: "invalid_request" }, 400);
  const name = clean(payload.name, 100);
  const phone = clean(payload.phone, 25).replace(/\D/g, "");
  const email = clean(payload.email, 254).toLowerCase();
  if (name.length < 3 || unsafeText(name) || payload.consent !== true || (!phone && !email) || (phone && !validPhone(phone)) || !validEmail(email)) return response({ accepted: false, error: "invalid_request" }, 400);
  if (!env.TURNSTILE_SECRET_KEY || !env.FORM_HMAC_SECRET) return response({ accepted: false, error: "service_unavailable" }, 503);
  if (!(await verifyTurnstile(request, env.TURNSTILE_SECRET_KEY, clean(payload.turnstileToken, 2048)))) return response({ accepted: false, error: "verification_rejected" }, 403);

  const address = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ?? "unknown";
  const userAgent = clean(request.headers.get("user-agent"), 256);
  if (!userAgent) return response({ accepted: false, error: "invalid_request" }, 400);
  const rateKey = await fingerprint(env.FORM_HMAC_SECRET, `${kind}:${address}`);
  if (!consumeRate(rateKey, now)) return response({ accepted: false, error: "rate_limited" }, 429, { "retry-after": "600" });

  const idempotency = clean(request.headers.get("idempotency-key"), 128);
  const replayKey = await fingerprint(env.FORM_HMAC_SECRET, JSON.stringify([kind, idempotency, name, phone, email, startedAt]));
  if (replayReservations.has(replayKey)) return response({ accepted: false, error: "duplicate_submission" }, 409);
  replayReservations.set(replayKey, now + REPLAY_TTL_MS);

  const requestId = `medos-${crypto.randomUUID()}`;
  const receivedAt = new Date(now).toISOString();
  const contact = [phone, email].filter(Boolean).join(" · ");
  let clinic: EmailContent;
  let patient: EmailContent;
  if (kind === "appointment") {
    if ([payload.serviceCategory, payload.preferredDate, payload.preferredTime].some(hasControlInput)) {
      replayReservations.delete(replayKey);
      return response({ accepted: false, error: "invalid_request" }, 400);
    }
    const serviceCategory = clean(payload.serviceCategory, 80);
    const preferredDate = clean(payload.preferredDate, 10);
    const preferredTime = clean(payload.preferredTime, 8);
    if (!serviceCategory || unsafeText(serviceCategory) || (preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) || (preferredTime && !/^\d{2}:\d{2}$/.test(preferredTime))) {
      replayReservations.delete(replayKey);
      return response({ accepted: false, error: "invalid_request" }, 400);
    }
    clinic = appointmentClinicTemplate({ name, contact, serviceCategory, preferredDate, preferredTime, receivedAt, requestId });
    patient = appointmentPatientTemplate(name, requestId);
  } else {
    if ([payload.subjectCategory, payload.message].some(hasControlInput)) {
      replayReservations.delete(replayKey);
      return response({ accepted: false, error: "invalid_request" }, 400);
    }
    const subjectCategory = clean(payload.subjectCategory, 80);
    const message = clean(payload.message, 1_000);
    if (!subjectCategory || unsafeText(subjectCategory) || message.length < 2 || /<[^>]+>/.test(message) || (message.match(/https?:\/\/|www\./gi) ?? []).length > 1) {
      replayReservations.delete(replayKey);
      return response({ accepted: false, error: "invalid_request" }, 400);
    }
    clinic = contactClinicTemplate({ name, contact, subjectCategory, message, receivedAt, requestId });
    patient = contactPatientTemplate(name, requestId);
  }

  const destination = kind === "appointment" ? env.MAIL_TO_CITAS : env.MAIL_TO_CONTACTO;
  if (!destination || !env.MAIL_FROM || !env.EMAIL) {
    replayReservations.delete(replayKey);
    console.warn(JSON.stringify({ event: "form_delivery", requestId, endpoint: kind, status: "unavailable" }));
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
        confirmation = result.ok ? "sent" : "failed";
      } catch {
        confirmation = "failed";
      }
    }
    console.log(JSON.stringify({ event: "form_delivery", requestId, endpoint: kind, status: "sent", confirmation, latencyMs: Date.now() - began, turnstile: true }));
    return response({ accepted: true, requestId, confirmation }, 202);
  } catch {
    replayReservations.delete(replayKey);
    console.error(JSON.stringify({ event: "form_delivery", requestId, endpoint: kind, status: "failed", latencyMs: Date.now() - began, turnstile: true }));
    return response({ accepted: false, error: "service_unavailable", requestId }, 503);
  }
};

export const resetFormSecurityForTests = () => {
  rateWindows.clear();
  replayReservations.clear();
};

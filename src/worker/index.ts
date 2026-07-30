import { handleForm, type FormEnv } from "./forms.ts";

interface Env extends FormEnv {
  ASSETS: Fetcher;
}

const SECURITY_HEADERS: Record<string, string> = {
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "content-security-policy": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; upgrade-insecure-requests",
};

const secure = (source: Response) => {
  const result = new Response(source.body, source);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) result.headers.set(name, value);
  result.headers.delete("server");
  result.headers.delete("x-powered-by");
  return result;
};

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  secure(new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  }));

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return request.method === "GET"
        ? json({ ok: true, service: "medos-uroclinic-web-preview" })
        : json({ error: "method_not_allowed" }, 405, { allow: "GET" });
    }

    // Retired: the legacy forwarding endpoint bypassed the hardened mail workflow.
    if (url.pathname === "/api/intake") return json({ error: "not_found" }, 404);
    if (url.pathname === "/api/appointment") return secure(await handleForm(request, env, "appointment"));
    if (url.pathname === "/api/contact") return secure(await handleForm(request, env, "contact"));
    if (url.pathname.startsWith("/api/")) return json({ error: "not_found" }, 404);

    return secure(await env.ASSETS.fetch(request));
  },
} satisfies ExportedHandler<Env>;

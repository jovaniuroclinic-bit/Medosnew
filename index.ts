interface Env {
  ASSETS: Fetcher;
  INTAKE_ENDPOINT?: string;
}

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });

const handleIntake = async (request: Request, env: Env): Promise<Response> => {
  if (request.method !== "POST") {
    return json({ accepted: false, error: "method_not_allowed" }, 405, { allow: "POST" });
  }

  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json({ accepted: false, error: "origin_not_allowed" }, 403);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ accepted: false, error: "unsupported_media_type" }, 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 32_768) {
    return json({ accepted: false, error: "payload_too_large" }, 413);
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ accepted: false, error: "invalid_json" }, 400);
  }

  const name = String(payload.name ?? "").trim();
  const phone = String(payload.phone ?? "").replace(/\D/g, "");
  const reason = String(payload.reason ?? "").trim();
  const website = String(payload.website ?? "").trim();
  const consent = payload.consent as { accepted?: boolean } | undefined;
  const requestId = String(payload.requestId ?? "").trim();

  if (website) return json({ accepted: true, requestId: requestId || "filtered" }, 202);
  if (name.length < 3 || name.length > 120 || phone.length < 10 || phone.length > 15 || !reason) {
    return json({ accepted: false, error: "validation_failed" }, 422);
  }
  if (consent?.accepted !== true) {
    return json({ accepted: false, error: "consent_required" }, 422);
  }
  if (!env.INTAKE_ENDPOINT) {
    console.warn(JSON.stringify({ event: "intake_not_configured", requestId }));
    return json({ accepted: false, error: "intake_not_configured" }, 503);
  }

  const upstream = await fetch(env.INTAKE_ENDPOINT, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-medos-request-id": requestId,
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await upstream.text();
  console.log(JSON.stringify({ event: "intake_forwarded", requestId, status: upstream.status }));

  return new Response(responseBody, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "medos-uroclinic-web-preview" });
    }

    if (url.pathname === "/api/intake") {
      return handleIntake(request, env);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

export async function securityHeaders(args: Record<string, unknown>) {
  if (process.env.NETWORK_DISABLED !== "false") return {ok: false, summary: "Red desactivada; habilítela y confirme el alcance"};
  const url = new URL(String(args.url ?? ""));
  if (url.protocol !== "https:") return {ok: false, summary: "Solo HTTPS"};
  const response = await fetch(url, {method: "HEAD", signal: AbortSignal.timeout(10_000)});
  const names = ["content-security-policy", "strict-transport-security", "x-content-type-options", "referrer-policy"];
  return {ok: true, summary: `HTTP ${response.status}`, details: Object.fromEntries(names.map((name) => [name, response.headers.has(name)]))};
}

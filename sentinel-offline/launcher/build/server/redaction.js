const sensitive = /password|passwd|secret|client_secret|token|access_token|refresh_token|authorization|cookie|private_key|api_key|apikey|credential|session/i;
const patterns = [/Bearer\s+\S+/giu, /eyJ[\w-]+\.[\w-]+\.[\w-]+/gu, /-----BEGIN[\s\S]*?PRIVATE KEY-----/gu, /(?:gh[pousr]_|github_pat_|cfat_|sk-)[\w-]{12,}/giu];
export function redact(value) {
    if (typeof value === "string")
        return patterns.reduce((v, p) => v.replace(p, "[REDACTED]"), value);
    if (Array.isArray(value))
        return value.map(redact);
    if (value && typeof value === "object")
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sensitive.test(k) ? "[REDACTED]" : redact(v)]));
    return value;
}

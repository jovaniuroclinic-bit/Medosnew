const keyed = /\b(authorization|cookie|set-cookie|password|passwd|client_secret|secret|access_token|refresh_token|api_key|apikey|token|credential|connection_string)\b(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/giu;
const patterns = [
  /\bBearer\s+[A-Za-z0-9._~+/-]+=*/giu,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/gu,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/gu,
  /\b(?:gh[pousr]_|github_pat_|cfat_|sk-)[A-Za-z0-9_-]{12,}\b/giu,
  /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s]+/giu,
];

export function redactCli(value: string): string {
  let output = value.replace(keyed, "$1$2[REDACTADO]");
  for (const pattern of patterns) output = output.replace(pattern, "[REDACTADO]");
  return output;
}

export function hasPotentialSecret(value: string): boolean {
  return redactCli(value) !== value;
}

import {homedir} from "node:os";

const secretPatterns = [
  /(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{20,}/giu,
  /cfat_[A-Za-z0-9_-]{20,}/giu,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/gu,
  /(?:password|secret|token|authorization)\s*[:=]\s*\S+/giu,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu,
];

export function containsSensitiveData(value: string): boolean {
  return secretPatterns.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
}

export function redact(value: string): string {
  let clean = [...value.replaceAll(homedir(), "$HOME")].map((character) => { const code = character.codePointAt(0) ?? 0; return code < 32 || code === 127 ? " " : character; }).join("");
  for (const pattern of secretPatterns) clean = clean.replace(pattern, "[REDACTADO]");
  return clean.slice(0, 4000);
}

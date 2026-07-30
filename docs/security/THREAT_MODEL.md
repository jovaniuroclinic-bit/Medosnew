# MEDOS threat model

## Assets and trust boundaries

Protected assets are Worker credentials, mail bindings, institutional mail, deployment access, and minimal contact data. Browser input is untrusted; Cloudflare edge, Worker runtime, email provider, GitHub Actions, and Proton delivery are separate trust boundaries. Autoevaluations remain client-side and must not be logged or emailed.

## Main threats and controls

Public forms face spam, replay, header injection, XSS, CSRF-like cross-origin posts, oversized bodies, provider abuse, and enumeration. Controls include strict schemas, 16 KiB limit, same-origin checks, honeypot, minimum completion time, mandatory server-side Turnstile, HMAC pseudonyms, short replay reservations, per-isolate burst limiting, escaped templates, fixed subjects, and generic errors. Durable zone-level rate limiting/WAF remains required because isolate memory is not globally consistent.

Supply-chain risks are reduced with frozen pnpm installs, Node 22, CI, Dependabot, CodeQL, least-privilege workflow permissions, and review requirements. Residual risks include email delivery dependency, Cloudflare plan capabilities, false positives, and unavailable global replay storage.

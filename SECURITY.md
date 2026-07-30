# Security policy

Report vulnerabilities privately to the repository administrators. Do not include patient data, credentials, tokens, medical images, or clinical details. The public `security.txt` is intentionally omitted until `security@drjovaniurologo.org` is confirmed as a routed alias.

Supported production code is the latest deployment from `main` or the approved production branch. Reports should include affected URL, impact, and non-destructive reproduction steps. Do not perform denial-of-service tests or send bulk form submissions.

Secrets are managed only through Cloudflare Workers secrets. Rotate exposed credentials immediately, review Worker deployments and GitHub audit logs, and follow `docs/security/INCIDENT_RESPONSE.md`.

# Form abuse runbook

Signals: increased 403/429, repeated request fingerprints, unusual countries/ASNs, empty user agents, and mail-volume alerts. Do not inspect or store message contents.

Start conservatively with a Managed Challenge on suspicious requests to `/api/contact` and `/api/appointment`, then add short-window rate limits. Escalate to temporary block only for repeated abuse. Exempt assets and `/api/health`; verify accessibility and real-patient completion after every change.

Turnstile must remain fail-closed. Verify widget hostnames are only `drjovaniurologo.org` and `www.drjovaniurologo.org`. Rotate `TURNSTILE_SECRET_KEY` and `FORM_HMAC_SECRET` after suspected exposure. A global KV/Durable Object binding must not be invented; use zone rate limiting for global enforcement.

# Secret rotation

Track names only: `TURNSTILE_SECRET_KEY`, `FORM_HMAC_SECRET`, `MAIL_FROM`, `MAIL_REPLY_TO`, `MAIL_TO_*`, Cloudflare API tokens and GitHub credentials.

1. Create a least-privilege replacement.
2. Validate it with a read-only or non-production operation.
3. Update the provider secret interactively; never use Git, logs or command-line values.
4. Deploy only if required and run health plus one synthetic test.
5. Revoke the old credential and record date, owner and evidence reference.

Rotate privileged tokens every 90 days, after staff changes, or immediately after suspected exposure. Rotate `FORM_HMAC_SECRET` in a quiet window because replay fingerprints change.

For exposure: revoke first, preserve value-free audit evidence, search tree and history, replace, validate and document impact. History rewriting requires explicit authorization and clone coordination.

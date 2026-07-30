# Account hardening

## Cloudflare

- Require passkeys or hardware-backed 2FA for every member and retain offline recovery methods.
- Review members, sessions and audit logs monthly; remove dormant users.
- Separate read-only backup, DNS-edit and deployment tokens. Scope each to one account/zone and rotate at least every 90 days.
- Alert on DNS, Worker route, custom-domain, Email Routing, Turnstile and ruleset changes.
- Export DNS after every approved change and record the previous Worker Version ID before deployment.

## GitHub

- Require passkeys/2FA and keep recovery codes offline.
- Protect production branches: pull request and required checks, resolved conversations, no force-push or deletion.
- Enable secret scanning, push protection and Dependabot alerts where the plan supports them.
- Review collaborators, deploy keys, Apps, webhooks, tokens and Actions permissions monthly.
- Default Actions to read-only repository contents.

## Mail accounts

- Require passkeys/2FA, offline recovery codes, monthly session/application review and quarterly recovery tests.
- Export mail monthly using the provider tool and encrypt the archive off-device.
- Never expose a private delivery mailbox in frontend code, APIs, public logs or documentation.
- Do not record provider recovery addresses alongside public routing aliases.

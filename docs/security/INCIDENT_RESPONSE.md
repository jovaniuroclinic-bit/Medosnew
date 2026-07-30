# Incident response

1. Stop abusive traffic with a narrowly scoped Cloudflare rule for `/api/contact` and `/api/appointment`; keep `/api/health` and assets unaffected.
2. Preserve request IDs, timestamps, endpoint/status aggregates, deployment IDs, and audit events. Never preserve form bodies or clinical data in application logs.
3. Revoke and rotate the affected secret in Cloudflare; revoke leaked GitHub credentials; invalidate sessions. Do not paste values into tickets or chat.
4. Disable form delivery fail-closed if confidentiality or mail integrity is uncertain. Publish the phone/WhatsApp fallback.
5. Patch, run all validation gates, deploy, perform one synthetic test, and monitor sanitized tail output.
6. Notify affected parties only after scope and legal obligations are established.

Rollback: use `wrangler versions list`, select the last verified version, then deploy/rollback through Wrangler. Revert the responsible Git commit in a new commit; never force-push the production branch.

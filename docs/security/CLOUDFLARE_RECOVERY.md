# Cloudflare recovery

Use a dedicated read-only API token. Minimum baseline permissions:

- Zone / Zone / Read
- Zone / DNS / Read
- Zone / Rulesets / Read
- Account / Workers Scripts / Read

Additional read permissions may be required for Email Routing, Turnstile or custom domains. A `403` is recorded as `BLOCKED` for that section; the exporter continues without weakening permissions. Never use a Global API Key.

```bash
export CLOUDFLARE_API_TOKEN
MEDOS_BACKUP_DIR=/backups/medos/cloudflare \
CLOUDFLARE_ZONE_NAME=drjovaniurologo.org \
MEDOS_BACKUP_GPG_RECIPIENT=FINGERPRINT \
scripts/security/export-cloudflare-dns.sh
```

The export is read-only. It records DNS, rulesets, routes, Worker metadata, Email Routing metadata, Turnstile widget metadata and domain metadata where permitted. Secret values and Worker source are deliberately excluded.

## Recovery order

1. Verify the archive and checksum.
2. Review DNS and rules JSON offline; back up the current zone before applying anything.
3. Restore the Worker from the Git commit and deploy through the validated Wrangler configuration.
4. Compare Worker routes and custom domains.
5. Restore DNS records individually, preserving mail records and proxy state.
6. Recreate redirect/WAF/rate-limit rules only after peer review.
7. Recreate secrets interactively from the secret register; never from this backup.
8. Validate apex, `www`, health, assets, Turnstile and mail delivery.

Rollback a Worker by selecting a known-good Version ID in Cloudflare or redeploying its signed Git commit. DNS changes require a second reviewer and a record-by-record rollback plan.

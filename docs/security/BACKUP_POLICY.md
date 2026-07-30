# Backup policy

| Asset | Frequency | Retention | Verification |
|---|---|---|---|
| Git mirror | Daily | 14 daily | SHA-256 and `git fsck` |
| Encrypted Git archive | Weekly | 12 weekly | GPG decrypt and restore |
| Cloudflare export | After changes and weekly | 12 | checksum and JSON |
| Mail export | Monthly | 12 | encrypted archive opens |
| Restore drill | Quarterly | evidence for one year | isolated recovery |

Keep three copies on two media types with one offline/offsite. Backups must remain outside this repository. Persistent mirrors require an encrypted volume; distributable archives should use a maintained GPG recipient.

Example cron, not installed automatically:

```cron
17 2 * * * MEDOS_BACKUP_DIR=/backups/medos/github /opt/medos/scripts/security/backup-github.sh
31 2 * * 0 MEDOS_BACKUP_DIR=/backups/medos/cloudflare /opt/medos/scripts/security/export-cloudflare-dns.sh
```

Example systemd timer schedule, not installed automatically:

```ini
[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=20m
```

Keep credentials in a root-readable `EnvironmentFile`, never in units or Git. Alert on missed runs, checksum failure, low space and restore failure.

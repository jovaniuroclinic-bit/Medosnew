# GitHub backup and restore

Backups must live outside the repository. Set `MEDOS_BACKUP_DIR` to a protected volume such as `/backups/medos/github`. For production, set `MEDOS_BACKUP_GPG_RECIPIENT` to a maintained GPG public-key fingerprint. The private key must remain offline and tested.

Run:

```bash
MEDOS_BACKUP_DIR=/backups/medos/github \
MEDOS_BACKUP_GPG_RECIPIENT=FINGERPRINT \
scripts/security/backup-github.sh

scripts/security/verify-github-backup.sh /backups/medos/github/medos-github-TIMESTAMP.tar.gz.gpg
```

The persistent `.mirror` is operational staging and should reside on an encrypted filesystem. The distributable archive is encrypted with GPG when a recipient is configured.

## Restore drill

1. Verify the `.sha256` and archive with `verify-github-backup.sh`.
2. Decrypt and extract in a temporary directory:
   `gpg --decrypt backup.tar.gz.gpg > backup.tar.gz`.
3. Extract `repository.git`.
4. Create a new empty private GitHub repository. Do not reuse production initially.
5. Remove embedded credentials from any destination URL.
6. From the extracted mirror run:
   `git --git-dir=repository.git push --mirror https://github.com/OWNER/RECOVERY.git`.
7. If LFS is reported as included, configure the recovery remote and run `git lfs push --all recovery`.
8. Compare branches, tags and HEAD with `manifest.txt`; run CI before changing DNS or production.

Never force-push the production repository during a drill.

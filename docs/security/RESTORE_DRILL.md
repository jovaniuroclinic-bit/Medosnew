# Quarterly restore drill

1. Select the newest backup and one older backup without modifying production.
2. Verify checksum, decrypt, extract and run `git fsck --full`.
3. Restore to a temporary local bare repository; compare HEAD, branches and tags with the manifest.
4. Validate a Cloudflare export and identify every `BLOCKED` section.
5. Build the restored commit using Node 22 and the public Turnstile test variable.
6. Do not deploy, change DNS or send mail during the drill.
7. Record recovery time, missing permissions, checksum, commit, operator and reviewer.
8. Destroy temporary plaintext copies according to the storage platform.

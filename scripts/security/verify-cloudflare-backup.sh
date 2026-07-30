#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

archive="${1:-}"
[[ -n "$archive" && -f "$archive" && -f "$archive.sha256" ]] || { printf 'ERROR: archive and checksum are required\n' >&2; exit 2; }
work="$(mktemp -d "${TMPDIR:-/tmp}/medos-cloudflare-verify.XXXXXX")"
trap 'rm -rf "$work"' EXIT
(cd "$(dirname "$archive")" && sha256sum --check "$(basename "$archive").sha256")
payload="$archive"
if [[ "$archive" == *.gpg ]]; then
  payload="$work/backup.tar.gz"
  gpg --batch --quiet --output "$payload" --decrypt "$archive"
fi
mkdir -p "$work/export"
tar -xzf "$payload" -C "$work/export"
[[ -f "$work/export/manifest.json" && -f "$work/export/dns.json" ]] || { printf 'ERROR: incomplete Cloudflare backup\n' >&2; exit 3; }
node -e 'const d=require(process.argv[1]); if(d.format!=="medos-cloudflare-backup-v1" || !d.zone_name) process.exit(1)' "$work/export/manifest.json"
for file in "$work"/export/*.json; do node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' "$file"; done
if rg -Il '(cfat_[A-Za-z0-9_-]{20,}|Authorization: Bearer|-----BEGIN [A-Z ]+PRIVATE KEY-----)' "$work/export" >/dev/null; then
  printf 'ERROR: potential credential found in export\n' >&2
  exit 4
fi
printf 'Cloudflare backup verified: checksum, manifest and JSON are valid.\n'

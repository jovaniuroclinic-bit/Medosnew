#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

repo_root="$(git rev-parse --show-toplevel)"
backup_dir="${MEDOS_BACKUP_DIR:-}"
zone_name="${CLOUDFLARE_ZONE_NAME:-drjovaniurologo.org}"
token="${CLOUDFLARE_API_TOKEN:-}"
[[ -n "$backup_dir" ]] || { printf 'ERROR: MEDOS_BACKUP_DIR is required\n' >&2; exit 2; }
[[ -n "$token" ]] || { printf 'ERROR: CLOUDFLARE_API_TOKEN is required\n' >&2; exit 2; }
mkdir -p "$backup_dir"
backup_dir="$(cd "$backup_dir" && pwd -P)"
case "$backup_dir/" in "$repo_root/"*) printf 'ERROR: backup destination must be outside the repository\n' >&2; exit 2;; esac
work="$(mktemp -d "${TMPDIR:-/tmp}/medos-cloudflare-export.XXXXXX")"
trap 'rm -rf "$work"' EXIT

api_get() {
  local label="$1" url="$2" output="$work/$1.json" status
  status="$(curl --silent --show-error --output "$output.tmp" --write-out '%{http_code}' \
    --header "Authorization: Bearer $token" --header 'Content-Type: application/json' "$url")"
  if [[ "$status" == 403 ]]; then
    printf '{"status":"BLOCKED","reason":"insufficient_read_permission"}\n' >"$output"
    rm -f "$output.tmp"
    return 0
  fi
  [[ "$status" == 2* ]] || { printf 'ERROR: Cloudflare section %s returned HTTP %s\n' "$label" "$status" >&2; return 1; }
  node -e 'const fs=require("fs"); const value=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); process.stdout.write(JSON.stringify({status:"OK",result:value.result,result_info:value.result_info},null,2)+"\n")' "$output.tmp" >"$output"
  rm -f "$output.tmp"
}

zone_id="${CLOUDFLARE_ZONE_ID:-}"
if [[ -z "$zone_id" ]]; then
  encoded_name="$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$zone_name")"
  api_get zone_lookup "https://api.cloudflare.com/client/v4/zones?name=$encoded_name"
  zone_id="$(node -e 'const d=require(process.argv[1]); process.stdout.write(d.result?.[0]?.id ?? "")' "$work/zone_lookup.json")"
fi
[[ -n "$zone_id" ]] || { printf 'ERROR: zone could not be resolved\n' >&2; exit 3; }

api_get zone "https://api.cloudflare.com/client/v4/zones/$zone_id"
account_id="$(node -e 'const d=require(process.argv[1]); process.stdout.write(d.result?.account?.id ?? "")' "$work/zone.json")"
api_get dns "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records?per_page=5000"
api_get rulesets "https://api.cloudflare.com/client/v4/zones/$zone_id/rulesets"
api_get worker_routes "https://api.cloudflare.com/client/v4/zones/$zone_id/workers/routes"
api_get email_routing_rules "https://api.cloudflare.com/client/v4/zones/$zone_id/email/routing/rules"

if [[ -n "$account_id" ]]; then
  api_get workers "https://api.cloudflare.com/client/v4/accounts/$account_id/workers/scripts"
  api_get worker_domains "https://api.cloudflare.com/client/v4/accounts/$account_id/workers/domains/records"
  api_get turnstile_widgets "https://api.cloudflare.com/client/v4/accounts/$account_id/challenges/widgets"
else
  printf '{"status":"BLOCKED","reason":"account_id_unavailable"}\n' >"$work/workers.json"
  cp "$work/workers.json" "$work/worker_domains.json"
  cp "$work/workers.json" "$work/turnstile_widgets.json"
fi

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
node -e 'process.stdout.write(JSON.stringify({format:"medos-cloudflare-backup-v1",created_utc:process.argv[1],zone_name:process.argv[2],zone_id:process.argv[3],worker:"medos-uroclinic-web-preview",secrets:"names-only: use wrangler secret list; values intentionally excluded"},null,2)+"\n")' "$timestamp" "$zone_name" "$zone_id" >"$work/manifest.json"

plain="$backup_dir/medos-cloudflare-$timestamp.tar.gz"
tar -czf "$plain" -C "$work" .
archive="$plain"
if [[ -n "${MEDOS_BACKUP_GPG_RECIPIENT:-}" ]]; then
  gpg --batch --yes --trust-model always --recipient "$MEDOS_BACKUP_GPG_RECIPIENT" --output "$plain.gpg" --encrypt "$plain"
  rm -f "$plain"
  archive="$plain.gpg"
else
  printf 'WARNING: Cloudflare backup is not encrypted; set MEDOS_BACKUP_GPG_RECIPIENT for production.\n' >&2
fi
sha256sum "$archive" >"$archive.sha256"
printf 'Cloudflare read-only export created: %s\n' "$archive"

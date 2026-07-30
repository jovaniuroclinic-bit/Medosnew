#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
umask 077
data="${MEDOS_SENTINEL_DATA_DIR:-$HOME/.local/share/medos-sentinel}"
destination="${MEDOS_SENTINEL_BACKUP_DIR:-$HOME/storage/shared/MEDOS_BACKUP_ENCRYPTED}"
recipient="${MEDOS_BACKUP_GPG_RECIPIENT:-}"
[[ -n "$recipient" ]] || { echo "ERROR: defina MEDOS_BACKUP_GPG_RECIPIENT; no se guardará texto claro en almacenamiento compartido"; exit 1; }
mkdir -p "$destination"; chmod 0700 "$destination" 2>/dev/null || true
temp="$(mktemp -d "${TMPDIR:-$HOME/.cache}/medos-sentinel-backup.XXXXXX")"
trap 'rm -rf -- "$temp"' EXIT
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
stage="$temp/stage"; mkdir -p "$stage"
for item in config sentinel.db sentinel.db-wal sentinel.db-shm manifests scripts; do
  [[ -e "$data/$item" ]] && cp -a -- "$data/$item" "$stage/"
done
find "$stage" -type f \( -name '*.gguf' -o -name '*.key' -o -name '*.env' \) -delete
(cd "$stage" && find . -type f ! -name MANIFEST.sha256 -print0 | sort -z | xargs -0 sha256sum > MANIFEST.sha256)
archive="$temp/medos-sentinel-$stamp.tar.gz"
tar -C "$stage" -czf "$archive" .
gpg --batch --yes --trust-model always --recipient "$recipient" --encrypt --output "$destination/$(basename "$archive").gpg" "$archive"
sha256sum "$destination/$(basename "$archive").gpg" > "$destination/$(basename "$archive").gpg.sha256"
chmod 0600 "$destination/$(basename "$archive").gpg" "$destination/$(basename "$archive").gpg.sha256" 2>/dev/null || true
echo "HECHO: backup cifrado y checksum creados"

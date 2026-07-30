#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
umask 077
archive="${1:-}"; [[ -f "$archive" ]] || { echo "Uso: restore-sentinel.sh ARCHIVO.gpg"; exit 2; }
checksum="$archive.sha256"; [[ -f "$checksum" ]] || { echo "ERROR: falta checksum"; exit 1; }
(cd "$(dirname "$archive")" && sha256sum -c "$(basename "$checksum")")
temp="$(mktemp -d "${TMPDIR:-$HOME/.cache}/medos-sentinel-restore.XXXXXX")"; trap 'rm -rf -- "$temp"' EXIT
gpg --batch --decrypt --output "$temp/archive.tar.gz" "$archive"
tar -tzf "$temp/archive.tar.gz" | grep -Eq '(^/|(^|/)\.\.(/|$))' && { echo "ERROR: rutas inseguras"; exit 1; } || true
mkdir "$temp/content"; tar -xzf "$temp/archive.tar.gz" -C "$temp/content" --no-same-owner --no-same-permissions
(cd "$temp/content" && sha256sum -c MANIFEST.sha256)
target="${MEDOS_SENTINEL_RESTORE_DIR:-$HOME/.local/share/medos-sentinel-restored}"
[[ ! -e "$target" ]] || { echo "ERROR: destino ya existe; no se sobrescribe"; exit 1; }
mv "$temp/content" "$target"; chmod -R go-rwx "$target"
echo "HECHO: restaurado en destino separado: $target"

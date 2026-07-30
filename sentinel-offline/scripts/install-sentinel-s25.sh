#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
umask 077
base="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
state="${MEDOS_SENTINEL_INSTALL_STATE:-$HOME/.local/state/medos-sentinel/install}"
mkdir -p "$state"; chmod 0700 "$state"
run_step() {
  local name="$1"; shift
  if [[ -f "$state/$name.done" ]]; then echo "HECHO: $name (checkpoint)"; return; fi
  "$@"; date -u +%FT%TZ > "$state/$name.done"
}
[[ "$(uname -m)" == "aarch64" ]] || { echo "ERROR: Galaxy/ARM64 requerido"; exit 1; }
free="$(df -Pk "$HOME" | awk 'NR==2{print $4*1024}')"; (( free >= 7516192768 )) || { echo "ERROR: se recomiendan al menos 7 GiB libres"; exit 1; }
run_step dependencies "$base/scripts/install-termux.sh"
run_step llama "$base/scripts/build-llama-cpp.sh"
run_step model "$base/scripts/download-model.sh"
run_step build corepack pnpm --dir "$base" build
run_step knowledge "$base/scripts/initialize-knowledge.sh"
run_step launcher "$base/scripts/create-launcher.sh"
run_step verify "$base/scripts/verify-installation.sh"
if [[ -n "${MEDOS_BACKUP_GPG_RECIPIENT:-}" ]]; then run_step backup "$base/scripts/backup-sentinel.sh"; else echo "PENDIENTE: backup inicial requiere destinatario GPG"; fi
echo "HECHO: instalación crítica validada"
echo "AHORA: ejecute medos"

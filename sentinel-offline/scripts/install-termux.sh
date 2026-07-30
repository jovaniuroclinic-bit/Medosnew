#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
[[ -n "${TERMUX_VERSION:-}" && "${PREFIX:-}" == /data/data/com.termux/files/usr ]] || { echo "ERROR: ejecute en Termux oficial"; exit 1; }
pkg update
pkg install -y git cmake clang make libandroid-spawn curl aria2 python nodejs sqlite gnupg
echo "HECHO: dependencias mínimas instaladas"

#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
umask 077
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
data="${MEDOS_SENTINEL_DATA_DIR:-$HOME/.local/share/medos-sentinel}"
mkdir -p "$data"
chmod 0700 "$data"
MEDOS_SENTINEL_DATA_DIR="$data" NETWORK_DISABLED=true node "$root/sentinel-offline/build/cli.js" importar-conocimiento "$root"
chmod 0600 "$data/sentinel.db"
echo "HECHO: SQLite FTS5 e importación autorizada inicializados"

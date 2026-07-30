#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
exec "$root/sentinel-offline/scripts/install-sentinel-s25.sh" "$@"

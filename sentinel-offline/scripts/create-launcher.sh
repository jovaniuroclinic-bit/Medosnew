#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
umask 077
base="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
mkdir -p "$HOME/.local/bin"
launcher="$HOME/.local/bin/medos"
printf '#!/data/data/com.termux/files/usr/bin/bash\nexport NETWORK_DISABLED="${NETWORK_DISABLED:-true}"\nexec node %q/build/cli.js "$@"\n' "$base" > "$launcher"
chmod 0700 "$launcher"
install -m 0700 "$base/scripts/medos-llm.sh" "$HOME/.local/bin/medos-llm"
echo "HECHO: comandos medos y medos-llm creados"

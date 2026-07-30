#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
umask 077
base="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
data="${MEDOS_SENTINEL_DATA_DIR:-$HOME/.local/share/medos-sentinel}"
model="${MEDOS_MODEL_PATH:-$data/models/Qwen3-4B-Q4_K_M.gguf}"
binary="${MEDOS_LLAMA_BINARY:-$HOME/.local/lib/medos-sentinel/bin/llama-cli}"
[[ "$(uname -m)" == "aarch64" ]] || { echo "PENDIENTE: prueba ARM64 solo disponible en el S25"; exit 2; }
[[ -x "$binary" ]] || { echo "ERROR: falta llama-cli"; exit 1; }
[[ -f "$model" ]] || { echo "ERROR: falta modelo"; exit 1; }
echo "7485fe6f11af29433bc51cab58009521f205840f5b4ae3a32fa7f92e8534fdf5  $model" | sha256sum -c --status
NETWORK_DISABLED=true node "$base/build/cli.js" verificar-instalacion
"$binary" -m "$model" -p "Responde únicamente: MEDOS_OK" -n 16 -c 512 -t 4 --no-display-prompt > "$data/model-smoke.tmp"
grep -q "MEDOS_OK" "$data/model-smoke.tmp"
shred -u "$data/model-smoke.tmp" 2>/dev/null || : > "$data/model-smoke.tmp"
echo "HECHO: runtime y modelo responden offline"

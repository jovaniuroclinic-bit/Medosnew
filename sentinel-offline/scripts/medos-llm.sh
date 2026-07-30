#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
umask 077
data="${MEDOS_SENTINEL_DATA_DIR:-$HOME/.local/share/medos-sentinel}"
binary="${MEDOS_LLAMA_BINARY:-$HOME/.local/lib/medos-sentinel/bin/llama-cli}"
model="${MEDOS_MODEL_PATH:-$data/models/Qwen3-4B-Q4_K_M.gguf}"
lock="$data/llama.lock"
[[ -x "$binary" && -f "$model" ]] || { echo "ERROR: runtime o modelo ausente"; exit 1; }
(set -o noclobber; : > "$lock") 2>/dev/null || { echo "ERROR: ya hay una inferencia"; exit 1; }
trap 'rm -f -- "$lock"' EXIT INT TERM
temp_path="${MEDOS_THERMAL_PATH:-/sys/class/thermal/thermal_zone0/temp}"
if [[ -r "$temp_path" ]]; then
  heat="$(awk '{v=$1; if(v>1000)v/=1000; print int(v)}' "$temp_path")"
  (( heat < ${MEDOS_THERMAL_LIMIT_C:-43} )) || { echo "PENDIENTE: pausa térmica"; exit 2; }
fi
exec timeout "${MEDOS_LLM_TIMEOUT_SECONDS:-120}" "$binary" -m "$model" -c "${MEDOS_CONTEXT_TOKENS:-4096}" -n "${MEDOS_MAX_TOKENS:-512}" -t "${MEDOS_LLM_THREADS:-6}" --no-display-prompt "$@"

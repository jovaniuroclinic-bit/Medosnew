#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
umask 077
name="Qwen3-4B-Q4_K_M.gguf"
revision="bc640142c66e1fdd12af0bd68f40445458f3869b"
url="https://huggingface.co/Qwen/Qwen3-4B-GGUF/resolve/${revision}/${name}"
expected="7485fe6f11af29433bc51cab58009521f205840f5b4ae3a32fa7f92e8534fdf5"
expected_size="2497280256"
model_dir="${MEDOS_MODEL_DIR:-$HOME/.local/share/medos-sentinel/models}"
target="$model_dir/$name"
mkdir -p "$model_dir"; chmod 0700 "$model_dir"
if [[ -f "$target" ]] && echo "$expected  $target" | sha256sum -c --status; then echo "HECHO: modelo ya verificado"; exit 0; fi
[[ "${NETWORK_DISABLED:-true}" == "false" ]] || { echo "PENDIENTE: habilite red explícitamente con NETWORK_DISABLED=false"; exit 2; }
free="$(df -Pk "$model_dir" | awk 'NR==2{print $4*1024}')"
(( free >= expected_size + 1073741824 )) || { echo "ERROR: espacio insuficiente"; exit 1; }
partial="$target.part"
aria2c --allow-overwrite=false --auto-file-renaming=false --continue=true --max-connection-per-server=4 --dir="$model_dir" --out="$name.part" "$url"
[[ "$(stat -c %s "$partial")" == "$expected_size" ]] || { echo "ERROR: tamaño inesperado"; exit 1; }
echo "$expected  $partial" | sha256sum -c --status || { echo "ERROR: checksum incorrecto; se conserva .part para diagnóstico"; exit 1; }
mv "$partial" "$target"; chmod 0600 "$target"
printf 'name=%s\nurl=%s\nrevision=%s\nsize=%s\nsha256=%s\nlicense=Apache-2.0\ndownloaded_utc=%s\n' "$name" "$url" "$revision" "$expected_size" "$expected" "$(date -u +%FT%TZ)" > "$target.manifest"
chmod 0600 "$target.manifest"
echo "HECHO: modelo oficial descargado y verificado"

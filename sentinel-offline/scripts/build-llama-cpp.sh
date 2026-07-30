#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail
umask 077
repo="https://github.com/ggml-org/llama.cpp.git"
commit="aedb2a5e9ca3d4064148bbb919e0ddc0c1b70ab3"
source_dir="${MEDOS_LLAMA_SOURCE_DIR:-$HOME/.local/src/llama.cpp}"
bin_dir="${MEDOS_SENTINEL_BIN_DIR:-$HOME/.local/lib/medos-sentinel/bin}"
case "$(uname -m)" in aarch64|arm64) ;; *) echo "ERROR: se requiere ARM64"; exit 1;; esac
if [[ ! -d "$source_dir/.git" ]]; then git clone --filter=blob:none "$repo" "$source_dir"; fi
git -C "$source_dir" fetch --depth 1 origin "$commit"
git -C "$source_dir" checkout --detach "$commit"
[[ "$(git -C "$source_dir" rev-parse HEAD)" == "$commit" ]] || { echo "ERROR: commit llama.cpp inesperado"; exit 1; }
cmake -S "$source_dir" -B "$source_dir/build-sentinel" -DGGML_LLAMAFILE=OFF -DGGML_OPENMP=OFF -DLLAMA_CURL=OFF -DBUILD_SHARED_LIBS=OFF -DCMAKE_BUILD_TYPE=Release
cmake --build "$source_dir/build-sentinel" --config Release -j "${MEDOS_BUILD_JOBS:-4}" --target llama-cli
mkdir -p "$bin_dir"
install -m 0700 "$source_dir/build-sentinel/bin/llama-cli" "$bin_dir/llama-cli"
sha256sum "$bin_dir/llama-cli" > "$bin_dir/llama-cli.sha256"
printf 'repository=%s\ncommit=%s\nbuilt_utc=%s\noptions=%s\n' "$repo" "$commit" "$(date -u +%FT%TZ)" "CPU static, CURL/O​​MP/LLAMAFILE off" > "$bin_dir/llama-cli.manifest"
echo "HECHO: llama-cli compilado y anclado a $commit"

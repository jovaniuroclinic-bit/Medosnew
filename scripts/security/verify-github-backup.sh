#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

archive="${1:-}"
[[ -n "$archive" && -f "$archive" ]] || { printf 'ERROR: backup archive is required\n' >&2; exit 2; }
[[ -f "$archive.sha256" ]] || { printf 'ERROR: checksum file is missing\n' >&2; exit 2; }
work="$(mktemp -d "${TMPDIR:-/tmp}/medos-github-verify.XXXXXX")"
trap 'rm -rf "$work"' EXIT

(cd "$(dirname "$archive")" && sha256sum --check "$(basename "$archive").sha256")
payload="$archive"
if [[ "$archive" == *.gpg ]]; then
  payload="$work/backup.tar.gz"
  gpg --batch --quiet --output "$payload" --decrypt "$archive"
fi
tar -xzf "$payload" -C "$work"
[[ -f "$work/manifest.txt" && -d "$work/repository.git" ]] || { printf 'ERROR: incomplete backup\n' >&2; exit 3; }
git --git-dir="$work/repository.git" fsck --full
git --git-dir="$work/repository.git" show-ref --head >/dev/null
expected="$(sed -n 's/^head_commit=//p' "$work/manifest.txt")"
actual="$(git --git-dir="$work/repository.git" rev-parse HEAD)"
[[ -n "$expected" && "$expected" == "$actual" ]] || { printf 'ERROR: HEAD does not match manifest\n' >&2; exit 4; }
refs_expected="$(sed -n 's/^refs_sha256=//p' "$work/manifest.txt")"
refs_actual="$(git --git-dir="$work/repository.git" for-each-ref --format='%(refname) %(objectname)' | LC_ALL=C sort | sha256sum | cut -d' ' -f1)"
[[ -n "$refs_expected" && "$refs_expected" == "$refs_actual" ]] || { printf 'ERROR: refs do not match manifest\n' >&2; exit 4; }
printf 'Backup verified: HEAD, refs, checksum and git fsck are valid.\n'

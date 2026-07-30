#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

repo_root="$(git rev-parse --show-toplevel)"
backup_dir="${MEDOS_BACKUP_DIR:-}"
remote="${MEDOS_GITHUB_REMOTE:-$(git -C "$repo_root" remote get-url origin)}"
retention="${MEDOS_BACKUP_RETENTION:-14}"

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
[[ -n "$backup_dir" ]] || fail "MEDOS_BACKUP_DIR is required"
[[ "$retention" =~ ^[1-9][0-9]*$ ]] || fail "MEDOS_BACKUP_RETENTION must be a positive integer"
[[ "$remote" != *$'\n'* ]] || fail "Invalid remote"
[[ "$remote" != *"://"* || "$remote" != *"://"*"@"* ]] || fail "Remote URL must not embed credentials"

mkdir -p "$backup_dir"
backup_dir="$(cd "$backup_dir" && pwd -P)"
case "$backup_dir/" in "$repo_root/"*) fail "Backup destination must be outside the repository";; esac

lock="$backup_dir/.backup.lock"
mkdir "$lock" 2>/dev/null || fail "Another backup is running"
work="$(mktemp -d "${TMPDIR:-/tmp}/medos-github-backup.XXXXXX")"
trap 'rm -rf "$work"; rmdir "$lock" 2>/dev/null || true' EXIT

mirror="$backup_dir/.mirror/medos.git"
mkdir -p "$(dirname "$mirror")"
if [[ -d "$mirror" ]]; then
  git --git-dir="$mirror" remote set-url origin "$remote"
  git --git-dir="$mirror" remote update --prune
else
  git clone --mirror "$remote" "$mirror"
fi
git --git-dir="$mirror" fsck --full

lfs_status="not-configured"
if command -v git-lfs >/dev/null 2>&1 && git --git-dir="$mirror" lfs ls-files --all 2>/dev/null | read -r _; then
  git --git-dir="$mirror" lfs fetch --all origin
  lfs_status="included"
fi

git clone --mirror "$mirror" "$work/repository.git"
git --git-dir="$work/repository.git" fsck --full
head_ref="$(git --git-dir="$mirror" symbolic-ref -q HEAD || true)"
head_commit="$(git --git-dir="$mirror" rev-parse HEAD)"
sanitized_remote="$(printf '%s' "$remote" | sed -E 's#(https?://)[^/@]+@#\1#')"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
cat >"$work/manifest.txt" <<EOF
format=medos-github-backup-v1
created_utc=$timestamp
remote=$sanitized_remote
head_ref=$head_ref
head_commit=$head_commit
lfs=$lfs_status
refs_sha256=$(git --git-dir="$mirror" for-each-ref --format='%(refname) %(objectname)' | LC_ALL=C sort | sha256sum | cut -d' ' -f1)
EOF

plain="$backup_dir/medos-github-$timestamp.tar.gz"
tar -czf "$plain" -C "$work" manifest.txt repository.git
archive="$plain"
if [[ -n "${MEDOS_BACKUP_GPG_RECIPIENT:-}" ]]; then
  command -v gpg >/dev/null 2>&1 || fail "gpg is required for encryption"
  gpg --batch --yes --trust-model always --recipient "$MEDOS_BACKUP_GPG_RECIPIENT" --output "$plain.gpg" --encrypt "$plain"
  rm -f "$plain"
  archive="$plain.gpg"
else
  printf 'WARNING: backup is not encrypted; set MEDOS_BACKUP_GPG_RECIPIENT for production.\n' >&2
fi
sha256sum "$archive" >"$archive.sha256"

shopt -s nullglob
archives=("$backup_dir"/medos-github-*.tar.gz "$backup_dir"/medos-github-*.tar.gz.gpg)
while ((${#archives[@]} > retention)); do
  old="${archives[0]}"
  rm -f "$old" "$old.sha256"
  archives=("${archives[@]:1}")
done

printf 'Backup created: %s\n' "$archive"
printf 'Checksum: %s.sha256\n' "$archive"

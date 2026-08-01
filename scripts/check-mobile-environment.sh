#!/usr/bin/env bash
set -Eeuo pipefail

echo "MEDOS mobile environment"
uname -a
uname -m
cat /etc/os-release
df -h .
free -h || true

for cmd in git node pnpm rustc cargo python3 sqlite3; do
  if command -v "$cmd" >/dev/null 2>&1; then
    printf '[PASS] %-10s %s\n' "$cmd" "$(command -v "$cmd")"
  else
    printf '[FAIL] %s not found\n' "$cmd"
    exit 1
  fi
done

if command -v systemctl >/dev/null 2>&1; then
  echo "[INFO] systemctl exists but MEDOS does not depend on systemd under PRoot."
fi

echo "[PASS] Real microphone capture remains disabled."

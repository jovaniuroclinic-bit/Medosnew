#!/usr/bin/env bash
set -Eeuo pipefail

export CARGO_BUILD_JOBS="${CARGO_BUILD_JOBS:-2}"

cargo test --workspace -j "$CARGO_BUILD_JOBS"

python3 - <<'PY'
import json
from pathlib import Path

schemas = sorted(Path("packages/contracts/json-schema/v2").glob("*.json"))
assert len(schemas) == 9
for schema in schemas:
    json.loads(schema.read_text(encoding="utf-8"))
print(f"[PASS] {len(schemas)} contract files contain valid JSON.")
PY

if command -v pnpm >/dev/null 2>&1; then
  export PUBLIC_TURNSTILE_SITE_KEY="1x00000000000000000000AA"
  export TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"

  TEST_HOME="$(mktemp -d /tmp/medos-git-home.XXXXXX)"
  chmod 700 "$TEST_HOME"
  trap 'rm -rf "$TEST_HOME"' EXIT

  HOME="$TEST_HOME" \
  XDG_CONFIG_HOME="$TEST_HOME/.config" \
  GIT_CONFIG_NOSYSTEM=1 \
  GIT_CONFIG_GLOBAL=/dev/null \
  GIT_TERMINAL_PROMPT=0 \
  GIT_ASKPASS=/bin/false \
  node --test test/security-backup.test.mjs

  TEST_FILES="$(find sentinel-offline/test test \
    -type f \
    -name '*.test.mjs' \
    ! -path 'test/security-backup.test.mjs' \
    -print 2>/dev/null || true)"

  if [ -n "$TEST_FILES" ]; then
    # shellcheck disable=SC2086
    node --test $TEST_FILES
  fi
fi

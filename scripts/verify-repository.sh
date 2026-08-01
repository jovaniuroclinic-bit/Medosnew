#!/usr/bin/env bash
set -Eeuo pipefail

test -f AGENTS.md
test -f Cargo.toml
test -f governance/privacy/AUDIO_POLICY.md
test -f governance/crypto/CRYPTO_POLICY.md
test -f docs/generated/ENVIRONMENT_DIAGNOSTIC.md
test -f docs/generated/REPOSITORY_INVENTORY.md
test "$(find packages/contracts/json-schema/v2 -name '*.json' | wc -l)" -eq 9
test ! -e tools/grok-cli

grep -Rq "Real microphone capture: disabled" apps/medos-cli
grep -Rq "Audio capture is disabled by default" governance/privacy

echo "[PASS] Repository invariants verified."

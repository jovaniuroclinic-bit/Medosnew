#!/usr/bin/env bash
set -Eeuo pipefail

export CARGO_BUILD_JOBS="${CARGO_BUILD_JOBS:-2}"

cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings

if command -v pnpm >/dev/null 2>&1; then
  pnpm lint
  pnpm check
  pnpm typecheck
fi

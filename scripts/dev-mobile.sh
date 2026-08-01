#!/usr/bin/env bash
set -Eeuo pipefail

export CARGO_BUILD_JOBS="${CARGO_BUILD_JOBS:-2}"
export MEDOS_PROFILE="mobile"
export MEDOS_REAL_AUDIO="false"
export MEDOS_ANALYSIS_ENABLED="false"
export RUST_LOG="info"

echo "MEDOS Sentinel mobile profile"
echo "- Real audio: disabled"
echo "- Synthetic audio: enabled for tests"
echo "- Docker: not required"
echo "- systemd: not required"
echo "- Production services: not started"

cargo run -p medos -- status

# Deployment Profiles

## Mobile development

Supported:

- Debian under Termux PRoot
- Rust libraries and CLI
- local encrypted files
- SQLite-compatible interfaces
- synthetic audio
- local metrics
- unit and lightweight integration tests

Unavailable or intentionally disabled:

- microphone capture from PRoot
- systemd
- privileged containers
- Wazuh stack
- MinIO cluster
- mandatory Ollama
- NVIDIA GPU
- GPIO

## Production

Requires an appropriate Linux server or Kubernetes platform and separate deployment review:

- PostgreSQL
- S3-compatible versioned object storage
- durable event bus
- OPA
- Prometheus and Grafana
- Wazuh
- KMS or Vault
- mTLS
- external checkpoints
- backup and restore validation

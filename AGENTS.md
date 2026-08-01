# MEDOS Sentinel — Permanent Engineering Rules

1. Inspect the repository before modification.
2. Never claim success without executed evidence.
3. Audio capture is disabled by default.
4. Never use real audio in automated tests.
5. Never implement covert recording or a lie detector.
6. Do not infer guilt, truth, criminal intent, medical diagnosis, or psychological diagnosis.
7. Do not enable microphone access from Debian PRoot.
8. Treat Android audio as a separate native bridge that is disabled until explicitly authorized and tested.
9. Never commit credentials, private keys, tokens, recordings, vaults, or production personal data.
10. Never mutate an immutable signed consent document.
11. Keep consent lifecycle and recording-session lifecycle separate.
12. Maintain one source of truth for contracts.
13. Centralize cryptographic operations in `packages/crypto-core`.
14. `unsafe` Rust is forbidden unless a separately reviewed exception is documented.
15. Run format, lint, tests, and repository verification after changes.
16. Do not execute Docker, Wazuh, MinIO, Ollama, Kubernetes, or other heavy production infrastructure on the phone.
17. Document every simulated, unavailable, or environment-blocked capability.
18. Prefer small, reversible and auditable changes.
19. Production recording indicators must fail closed.
20. This system is hardened and auditable, not impenetrable.

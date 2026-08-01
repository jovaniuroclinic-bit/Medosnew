# Cryptographic Policy

Initial approved algorithms:

- Hash: SHA-256
- Signature: Ed25519
- AEAD: XChaCha20-Poly1305
- Nonce source: operating-system CSPRNG
- Data key: unique per protected object or segment
- Critical metadata: authenticated as AEAD additional data
- Canonical JSON: RFC 8785-compatible JCS serialization

Keys and secrets must remain outside the repository. Nonces must never be reused with the same key.

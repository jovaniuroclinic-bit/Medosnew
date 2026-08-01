# Key Lifecycle

1. Generate keys using an approved CSPRNG.
2. Assign a non-sensitive key identifier.
3. Store private key material outside the repository.
4. Record creation, activation, rotation, revocation and destruction events.
5. Permit verification with historical public keys.
6. Rotate compromised or expired keys.
7. Destroy wrapped data keys to support cryptographic erasure where policy permits.

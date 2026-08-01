# ADR: Production boundary

- Status: Accepted
- Date: 2026-08-01

## Context

MEDOS runs during development on Android/Termux with Debian PRoot, without root, systemd, a Docker daemon or reliable direct hardware access.

## Decision

Deploy PostgreSQL, durable bus, S3, OPA, monitoring and key management only on appropriate servers.

## Consequences

The mobile profile remains lightweight and explicitly simulated where hardware or production infrastructure is unavailable. Production services remain separate deployment targets.

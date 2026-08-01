# MEDOS Contracts

`packages/contracts` is the single contract source of truth.

- `json-schema/v1`: retained only for explicit legacy migrations.
- `json-schema/v2`: active JSON Schema 2020-12 contracts.
- `protobuf`: future gRPC definitions derived from the same domain model.
- `migrations`: explicit compatibility transformations.
- `generated`: generated clients and documentation.

Independent `schemas/` or `packages/event-schema/` sources must not be introduced.

# Architecture snapshot

La CLI reside en `sentinel-offline`. Comparte Policy Engine, estado/checkpoint y
los contratos Launcher de health, vault-selection, vault-adapter,
encrypted-store, backup, recovery, OAuth, action-links y redacción. Las
operaciones delegan en `scripts/medos-*` con argumentos separados y timeouts.
Selección de bóveda, cifrado, persistencia, backup/restore y autorización siguen
en Launcher; la CLI sólo consulta/prepara acción humana y falla cerrada.

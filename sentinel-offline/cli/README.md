# Centinela CLI

Interfaz operativa local. `./scripts/centinela` usa el Policy Engine existente,
delega en `scripts/medos-*` y comparte contratos de bóveda, health,
autorización, backup, recovery y redacción con Launcher. No almacena claves ni
conecta cuentas. Sin argumentos muestra menú en TTY; no descarga dependencias.

Códigos: 0 completado, 1 fallo, 2 argumentos, 3 seguridad, 4 humano, 5 bóveda,
6 dependencia, 7 health, 8 Git, 9 secreto y 10 CI. `status --json` emite sólo
JSON. Al añadir comandos valide argumentos, use `evaluateAction`, reutilice un
servicio y pruebe fail-closed. Nunca use `eval`, shell concatenado, secretos en
argumentos o binds públicos.

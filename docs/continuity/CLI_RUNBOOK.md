# CLI runbook

Use `./scripts/centinela --help`; sin argumentos hay menú en TTY. `pnpm
centinela` equivale. El wrapper sólo compila con dependencias instaladas.
`status`, doctor, test, logs, resume y version funcionan sin bóveda. Acciones
sensibles pasan por Policy Engine y confirmación/clic. Bóveda sólo se selecciona
en Launcher; auth prepare nunca conecta. n8n: `127.0.0.1:5678`, Community Nodes
deshabilitados y workflows inactivos. Backup exige bóveda/cifrado.

Emergency-lock exige `BLOQUEAR` o `--confirm-lock` y preserva datos. JSON sólo
en stdout. Códigos: 0 completado; 1 fallo; 2 argumentos; 3 seguridad; 4 humano;
5 bóveda; 6 dependencia; 7 health; 8 Git; 9 secreto; 10 remoto.

Pruebe `doctor --check`, `test full` y `NO_COLOR=1 ./scripts/centinela status`.
Para añadir comandos reutilice servicios, valide lista cerrada, use Policy
Engine, procesos con arrays/`shell:false`, redacción y pruebas. Checkpoint:
`./scripts/centinela checkpoint --message "checkpoint: continuidad" --commit
--push --wait-ci`.

# MEDOS — Instrucciones permanentes para agentes

## LEE ESTO ANTES DE MODIFICAR NADA

Repositorio esperado:

```text
/workspace/Medosnew
```

Antes de realizar cualquier cambio:

1. Lee `docs/continuity/CODEX_HANDOFF.md`.
2. Lee `docs/continuity/CURRENT_STATUS.md`.
3. Lee `docs/continuity/NEXT_ACTIONS.md`.
4. Lee `docs/continuity/SECURITY_INVARIANTS.md`.
5. Ejecuta:

```sh
cd /workspace/Medosnew
./scripts/medos-resume --check
```

## Reglas no negociables

- No descartes cambios sin inspeccionarlos.
- No inventes archivos, rutas, variables, estados ni credenciales.
- No repitas tareas marcadas como completadas.
- No conectes cuentas reales sin autorización humana explícita.
- No solicites secretos por chat, terminal compartida ni logs.
- No almacenes secretos en Git.
- No imprimas secretos en logs.
- Mantén el comportamiento fail-closed.
- No expongas servicios fuera de `127.0.0.1`.
- No actives workflows automáticamente.
- No desactives controles de seguridad.
- No uses `git push --force`.
- No reescribas el historial.
- Ejecuta el secret scan antes de cada commit.
- Deja CI y CodeQL en PASS.
- Actualiza la documentación de continuidad antes de terminar.
- Crea un checkpoint persistente antes de agotar los tokens o cerrar la sesión.

## Comandos iniciales

```sh
cd /workspace/Medosnew
git status --short --branch
git log --oneline --decorate -10
./scripts/medos-resume --check
./scripts/centinela status
./scripts/centinela doctor --check
```

## Comando principal del Centinela

```sh
cd /workspace/Medosnew
./scripts/centinela
```

## Validación completa

```sh
cd /workspace/Medosnew
./scripts/medos-doctor --check
./scripts/medos-test --full
```

## Continuación del trabajo

Continúa desde la primera tarea P0 pendiente registrada en
`docs/continuity/NEXT_ACTIONS.md`. No repitas tareas terminadas.

## Checkpoint de cierre

Antes de terminar una sesión ejecuta:

```sh
cd /workspace/Medosnew

./scripts/medos-checkpoint \
  --message "checkpoint: continuidad de sesión" \
  --commit \
  --push \
  --wait-ci
```

Si el checkpoint falla:

1. conserva el working tree;
2. no descartes cambios;
3. revisa exclusivamente la causa;
4. corrige;
5. vuelve a validar;
6. crea commit y push sin force;
7. deja CI y CodeQL en PASS.

## Detención segura

Si no puedes completar una tarea:

- documenta el estado real;
- registra la siguiente acción exacta;
- marca cualquier dependencia humana;
- no declares PASS sin evidencia;
- no conectes cuentas;
- no inventes resultados;
- deja el repositorio recuperable.

# MEDOS Sentinel Offline

Agente local defensivo y forense para Galaxy S25 Ultra mediante Termux, sin
root, telemetría ni APIs externas. El modelo nunca ejecuta comandos: propone una
acción estructurada, el policy engine la clasifica, el usuario aprueba cuando
corresponde y solo una herramienta registrada puede ejecutarla.

## Arquitectura

`cli → orchestrator → policy/approval → tool registry → redaction → checkpoint`.
SQLite FTS5 conserva fragmentos autorizados y citas, no conversaciones completas.
Casos y evidencia viven fuera del repositorio. llama.cpp usa CPU local y el
modelo oficial Qwen3-4B Q4_K_M (2,497,280,256 bytes).

Fuentes fijadas:

- Qwen: revisión `bc640142c66e1fdd12af0bd68f40445458f3869b`, SHA-256
  `7485fe6f11af29433bc51cab58009521f205840f5b4ae3a32fa7f92e8534fdf5`,
  Apache-2.0.
- llama.cpp: tag `b9637`, commit
  `aedb2a5e9ca3d4064148bbb919e0ddc0c1b70ab3`.

## Instalación en Termux

Instale Termux desde F-Droid/GitHub oficial, clone MEDOS y ejecute:

```bash
export NETWORK_DISABLED=false
scripts/install-sentinel-s25.sh
export NETWORK_DISABLED=true
medos
```

La red solo se habilita explícitamente para clonar fuentes y descargar el
modelo. Después funciona en modo avión. La UI del Checkpoint A se sirve
exclusivamente en `127.0.0.1` y no debe exponerse mediante túneles o proxies:

```bash
corepack pnpm sentinel:ui
```

Abra `http://127.0.0.1:4317` en el mismo dispositivo.

## Comandos

`medos`, `medos ui`, `medos estado`, `medos consultar TEXTO`, `medos continuar`,
`medos caso-nuevo TITULO`, `medos emergencia` y `medos verificar-instalacion`.
Los flujos de backup/restauración se ejecutan con confirmación desde el menú o
los scripts dedicados.

## Límites verificables

La compilación e inferencia reales, rendimiento y temperatura deben medirse en
el S25. Este repositorio valida lógica con datos sintéticos; no incluye GGUF,
bases reales, casos, evidencia, claves ni backups. Sentinel no sustituye a un
perito, no atribuye culpabilidad y no accede a otras aplicaciones.

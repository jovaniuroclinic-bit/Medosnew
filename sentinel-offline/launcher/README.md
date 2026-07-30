# MEDOS Secure Account Launcher

Interfaz local para administrar referencias opacas, permisos y estado de
conexiones. Escucha exclusivamente en `127.0.0.1`, no almacena secretos y falla
cerrada hasta configurar una bóveda segura fuera de Git.

## Inicio

```bash
corepack pnpm --dir sentinel-offline/launcher install --frozen-lockfile
corepack pnpm --dir sentinel-offline/launcher build
./sentinel-offline/launcher/scripts/medos-accounts --no-browser
```

Todos los proveedores comienzan como “Configuración requerida”. OAuth exige
client ID, redirect URI exacta y scopes mínimos definidos por el propietario.
El intercambio de código ocurre servidor a servidor usando PKCE, state y nonce.

`VaultAdapter` solo expone referencias y metadata. La implementación inicial
rechaza toda conexión: no selecciona un backend inseguro. Adaptadores futuros
pueden usar secret-service, credenciales del SO, archivo GPG externo o aliases
n8n tras revisión. Backups ordinarios contienen solo referencias y metadata.

El botón de emergencia invalida sesiones y bloquea nuevos usos sin borrar
secretos. Revocar, rotar o desbloquear exige reautenticación local. El modelo de
amenazas cubre CSRF, replay OAuth, DNS rebinding, fuga por logs y exposición en
red; no protege un dispositivo desbloqueado o comprometido.

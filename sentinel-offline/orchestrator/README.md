# MEDOS n8n Orchestrator

n8n `2.32.6` fijado para ejecución local en `127.0.0.1`. Este directorio
versiona únicamente manifiestos, lockfile y configuración pública. No contiene
base n8n, credenciales, encryption key, ejecuciones, logs ni backups.

Community Nodes permanecen deshabilitados y la allowlist bloquea Execute
Command, SSH, FTP, webhooks públicos y acceso arbitrario a archivos. Los
workflows deben permanecer inactivos hasta aprobación explícita del propietario.
El Launcher usa exclusivamente credential IDs, aliases y metadata; nunca
extrae secretos desde n8n.

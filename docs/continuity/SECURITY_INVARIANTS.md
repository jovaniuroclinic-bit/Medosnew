# MEDOS — Invariantes permanentes de seguridad

Estas reglas son obligatorias para cualquier persona, agente, proceso automatizado o sesión de desarrollo que modifique u opere MEDOS.

## 1. Red y exposición

- Todos los servicios locales deben enlazarse exclusivamente a `127.0.0.1`.
- Está prohibido escuchar en `0.0.0.0`.
- Está prohibido escuchar en `::`.
- El Launcher, el Bridge y n8n deben permanecer accesibles únicamente desde loopback.
- No se deben abrir puertos públicos automáticamente.
- Cualquier despliegue o cambio de DNS requiere autorización humana explícita.

## 2. Fail-closed

- Sin bóveda disponible o seleccionada, toda operación sensible debe permanecer bloqueada.
- La ausencia de configuración, autorización o credenciales nunca debe habilitar un modo permisivo.
- Los fallos de validación deben detener la operación de forma segura.
- No se debe degradar silenciosamente la seguridad para mantener una función disponible.

## 3. Secretos

- Ningún secreto debe almacenarse en Git.
- Ningún secreto debe enviarse al frontend.
- Ningún secreto debe imprimirse en logs.
- Ningún secreto debe incluirse en documentación, commits, artefactos de CI o paquetes de recuperación.
- No deben solicitarse claves, tokens, contraseñas, cookies o códigos OAuth mediante chat.
- Los secretos deben almacenarse únicamente en la bóveda autorizada.
- Las claves de cifrado no deben guardarse junto a los backups.

## 4. Autorizaciones

- Ninguna cuenta real debe conectarse automáticamente.
- Toda autorización debe requerir una acción humana explícita.
- OAuth debe utilizar PKCE, `state` y `nonce` cuando corresponda.
- Los enlaces de autorización deben ser de uso único cuando la arquitectura lo permita.
- Los códigos OAuth y tokens nunca deben aparecer en logs.
- Las conexiones deben operar con privilegio mínimo.

## 5. Sesiones y conexiones

- Las sesiones deben poder invalidarse de forma segura.
- Las renovaciones deben poder detenerse mediante el bloqueo de emergencia.
- Las conexiones deben permanecer deshabilitadas hasta contar con autorización humana y bóveda válida.
- No se debe asumir que una cuenta está conectada únicamente porque exista configuración parcial.

## 6. n8n

- n8n debe enlazarse únicamente a `127.0.0.1:5678`.
- Los workflows deben permanecer inactivos hasta autorización explícita.
- Community Nodes deben permanecer deshabilitados.
- Los nodos considerados peligrosos deben permanecer bloqueados.
- La telemetría debe permanecer deshabilitada cuando la configuración disponible lo permita.
- Los datos de runtime deben permanecer fuera de Git.
- Las credenciales de n8n no deben exportarse.
- La clave de cifrado debe residir exclusivamente en la bóveda.

## 7. Backups y recuperación

- Los backups productivos deben estar cifrados.
- No se debe crear un backup productivo sin bóveda real seleccionada.
- Los backups sintéticos pueden utilizarse únicamente para pruebas.
- Toda estrategia de backup debe incluir una restauración verificada.
- Los metadatos de backup no deben contener secretos.
- Los paquetes de recuperación no deben incluir `.env`, bases de datos, credenciales, sesiones, claves, cookies ni logs sin redactar.

## 8. Logs

- Los logs deben limitar tamaño y retención.
- Toda salida debe pasar por redacción antes de mostrarse.
- Deben redactarse como mínimo:
  - tokens Bearer;
  - JWT;
  - cookies;
  - claves API;
  - secretos OAuth;
  - contraseñas;
  - claves privadas;
  - cadenas de conexión;
  - cabeceras de autorización.
- La detección de un posible secreto debe registrarse sin imprimir su valor.

## 9. Procesos

- Los procesos deben identificarse mediante PID registrado, identidad y ruta verificadas.
- Está prohibido usar `killall` o terminaciones indiscriminadas.
- No deben quedar procesos huérfanos.
- Los archivos PID deben almacenarse fuera de Git con permisos restrictivos.
- El bloqueo de emergencia debe preservar datos y backups.

## 10. Git y continuidad

- Está prohibido usar force push.
- Está prohibido reescribir el historial.
- Ningún cambio debe descartarse sin inspección.
- Antes de cada commit deben ejecutarse:
  - revisión del diff;
  - `git diff --check`;
  - pruebas aplicables;
  - escaneo de secretos.
- CI y CodeQL deben quedar en PASS.
- Antes de terminar una sesión se deben actualizar:
  - `CURRENT_STATUS.md`;
  - `NEXT_ACTIONS.md`;
  - `SESSION_MANIFEST.json`;
  - `CHANGELOG_SESSION.md`;
  - el prompt de reanudación.
- Cada sesión debe terminar con un checkpoint persistente cuando existan cambios.

## 11. Archivos prohibidos en Git

No deben versionarse:

- `.env`;
- `.env.local`;
- `.env.production`;
- claves privadas;
- certificados con clave;
- bases de datos;
- `.n8n/`;
- runtime state;
- sesiones;
- credenciales;
- secretos;
- logs;
- archivos PID;
- backups productivos;
- cookies;
- tokens;
- artefactos temporales sensibles.

Los archivos `.env.example` sí deben permanecer versionados y contener únicamente nombres, propósito y formato no sensible.

## 12. CLI y Launcher

- La CLI y el Launcher deben utilizar el mismo estado y Policy Engine.
- No se debe duplicar lógica de seguridad.
- Los comandos informativos deben funcionar sin bóveda.
- Las operaciones sensibles deben permanecer bloqueadas sin bóveda.
- Los argumentos deben tratarse como datos.
- Está prohibido utilizar `eval`.
- Los procesos deben ejecutarse sin concatenación insegura de shell.
- El modo JSON no debe incluir decoración ANSI ni secretos.

## 13. Detención segura

Ante una condición no verificable:

1. detener la operación;
2. preservar los datos;
3. mantener fail-closed;
4. documentar el bloqueo;
5. registrar la siguiente acción exacta;
6. marcar la dependencia humana;
7. no declarar PASS sin evidencia.

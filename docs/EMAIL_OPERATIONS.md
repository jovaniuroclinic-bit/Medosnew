# Operación de correo institucional

## Arquitectura

Los alias de `drjovaniurologo.org` son reglas de reenvío de Cloudflare Email Routing, no buzones
independientes. Catch-all permanece desactivado. El destino privado no se guarda en Git.

El Worker expone `POST /api/appointment` y `POST /api/contact`. Valida una lista cerrada de campos,
consentimiento, origen, tipo y tamaño; aplica honeypot y tiempo mínimo; sanitiza texto y rechaza HTML,
inyección de cabeceras implícita mediante caracteres de control y URLs repetitivas. No acepta respuestas
de autoevaluaciones.

El binding `EMAIL` implementa envío desacoplado. La solicitud a la clínica tiene prioridad; un fallo de
confirmación al paciente no invalida una entrega clínica exitosa. Los logs contienen solo estado técnico,
identificador, tipo, latencia y código.

## Secretos requeridos

- `MAIL_FROM`
- `MAIL_TO_CITAS`
- `MAIL_TO_CONTACTO`
- `MAIL_TO_PRIVACIDAD`
- `MAIL_REPLY_TO`
- `FORM_HMAC_SECRET`

Los valores se cargan exclusivamente mediante `wrangler secret put`. `.dev.vars.example` contiene solo
valores ficticios.

## Alta y verificación

1. Confirmar que el destino de reenvío figura como `verified`.
2. Respaldar MX/TXT y comprobar que no existe otro proveedor.
3. Habilitar Email Routing con los registros oficiales de Cloudflare.
4. Crear reglas explícitas; no habilitar catch-all.
5. Probar cada alias con mensajes sintéticos y confirmar recepción en el destino.
6. Comprobar SPF, DKIM y DMARC sin crear un segundo SPF.

Email Sending beta requiere permisos separados. Si la API devuelve `Unauthorized 2036`, se considera
bloqueo externo y no se habilitan ni inventan registros de envío.

## Rollback

El Worker puede revertirse desplegando la versión anterior desde Cloudflare o el commit previo. Las reglas
de correo deben desactivarse individualmente; no se eliminan MX/TXT sin restaurar antes el respaldo del
proveedor anterior. Nunca se usa force push.

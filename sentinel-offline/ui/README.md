# Interfaz local

PWA estática sin CDN, telemetría ni recursos remotos. El backend se enlaza
exclusivamente a `127.0.0.1`; CSP impide conexiones externas. Checkpoint A no
conecta cuentas, n8n, expedientes ni modelo.

Ejecute `node sentinel-offline/build/localServer.js` y abra
`http://127.0.0.1:4317`. No reenvíe el puerto con túneles ni proxies.

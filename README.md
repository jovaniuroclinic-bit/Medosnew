# MEDOS / UROCLINIC web

Sitio público de UROCLINIC Dr. Jovani, construido con Astro estático y desplegado como Cloudflare Worker con activos estáticos y un entrypoint real.

## Arquitectura

- `apps/web`: Astro 5, páginas estáticas y estilos.
- `src/index.ts`: Worker ES Modules; expone `/api/health`, protege `/api/intake` y entrega el resto mediante `ASSETS`.
- `wrangler.jsonc`: fuente de verdad del despliegue.
- `.github/workflows/ci.yml`: lint, typecheck, pruebas disponibles, build, validación de rutas y dry-run.

## Comandos

```bash
corepack enable
corepack prepare pnpm@11.13.1 --activate
pnpm install --no-frozen-lockfile
pnpm run check
pnpm run deploy:dry-run
pnpm run deploy
```

## Cloudflare Workers Builds

Configurar el Worker `medos-uroclinic-web-preview` con:

- Repositorio: `adminuroclinicdrjovani-dotcom/Project`
- Rama de producción: `main`
- Directorio raíz: `/`
- Comando de compilación: `corepack enable && corepack prepare pnpm@11.13.1 --activate && pnpm install --no-frozen-lockfile && pnpm run build`
- Comando de despliegue: `pnpm run deploy`
- Comando de preview: `pnpm exec wrangler versions upload`

El nombre del Worker coincide exactamente con `wrangler.jsonc`, requisito de Workers Builds.

## Variables y secretos

El sitio no contiene secretos. Para activar el formulario en producción, configurar en Cloudflare una variable secreta de runtime llamada `INTAKE_ENDPOINT` con la URL HTTPS del webhook de recepción. `keep_vars: true` evita eliminar variables ya configuradas en el panel durante un despliegue.

## Rutas verificadas por CI

- `/`
- `/servicios`
- `/programas`
- `/contacto`
- `/privacidad`
- `/api/health`
- página 404

## Dominio

El sitio genera URL canónica para `https://drjovaniurologo.org`. La asociación del dominio personalizado se conserva en Cloudflare y no se guarda como secreto en GitHub.

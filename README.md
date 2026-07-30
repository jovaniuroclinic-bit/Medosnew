# MEDOS / UROCLINIC

Sitio público de UROCLINIC Dr. Jovani. Es una aplicación Astro estática servida por Cloudflare Workers Static Assets, con un Worker ES Modules para las rutas API.

## Arquitectura

- `src/pages`: páginas y rutas estáticas de Astro.
- `src/layouts`: layout compartido y metadatos SEO.
- `src/styles`: estilos globales.
- `src/worker/index.ts`: Worker; expone `/api/health`, valida `/api/intake` y delega activos a `ASSETS`.
- `public`: favicon, manifest y tarjetas sociales.
- `dist`: salida generada, no versionada.
- `wrangler.jsonc`: configuración de despliegue del Worker `medos-uroclinic-web-preview`.

## Requisitos

- Node.js 22 LTS.
- pnpm 11.18 mediante Corepack.

## Desarrollo y validación

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm lint
pnpm check
pnpm build
pnpm verify
pnpm deploy:dry-run
```

`pnpm check` y `pnpm typecheck` ejecutan ambos `astro check`; el segundo se conserva como alias explícito para CI y diagnóstico.

## Despliegue

```bash
pnpm deploy
```

Wrangler compila `src/worker/index.ts` y publica `dist` mediante el binding `ASSETS`. Las rutas `/api/*` ejecutan primero el Worker. Las demás rutas se sirven como activos estáticos, con URLs sin barra final y página `404.html`.

El dominio canónico de build es `https://drjovaniurologo.org`.

## Variables

- `INTAKE_ENDPOINT`: secreto o variable HTTPS de runtime configurada en Cloudflare. Si falta, `/api/intake` devuelve 503 de forma controlada.
- `PUBLIC_SITE_ENV`: opcional; `preview` activa `noindex` y el banner de preview. El valor predeterminado es `production`.
- `PUBLIC_FORM_MODE`: opcional; `preview` marca solicitudes sintéticas. El valor predeterminado es `production`.
- `PUBLIC_INTAKE_ENDPOINT`: opcional; por defecto el formulario usa `/api/intake`.

No se deben guardar secretos ni datos de pacientes en el repositorio. El formulario público admite únicamente datos administrativos mínimos.

## CI

`.github/workflows/ci.yml` usa Node.js 22 y pnpm con lockfile congelado. Ejecuta pruebas, lint, Astro/TypeScript, build, verificación del artefacto y dry-run de Wrangler.

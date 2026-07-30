import { access, readFile, readdir, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { extname, resolve } from "node:path";

const dist = resolve("dist");
const expected = [
  "index.html",
  "servicios/index.html",
  "programas/index.html",
  "contacto/index.html",
  "privacidad/index.html",
  "404.html",
  "favicon.svg",
  "site.webmanifest",
  "social-card.png",
];

for (const relativePath of expected) {
  const fullPath = resolve(dist, relativePath);
  await access(fullPath, constants.R_OK);
  if ((await stat(fullPath)).size === 0) throw new Error(`Artefacto vacío: ${relativePath}`);
}

const htmlFiles = expected.filter((file) => extname(file) === ".html");
const forbidden = /(?:noindex|localhost|127\.0\.0\.1|\/workspace|\/sdcard|backup)/i;
const hrefPattern = /href="(\/[^"]*)"/g;

for (const htmlFile of htmlFiles) {
  const html = await readFile(resolve(dist, htmlFile), "utf8");
  if (forbidden.test(html)) throw new Error(`Referencia prohibida en ${htmlFile}`);
  if (!html.includes('<link rel="canonical" href="https://drjovaniurologo.org')) {
    throw new Error(`Canonical ausente o incorrecto en ${htmlFile}`);
  }
  if (!html.includes('property="og:title"') || !html.includes('property="og:image"')) {
    throw new Error(`Open Graph incompleto en ${htmlFile}`);
  }

  for (const [, rawHref] of html.matchAll(hrefPattern)) {
    const pathname = rawHref.split(/[?#]/, 1)[0];
    if (!pathname || pathname === "/") continue;
    const relative = pathname.slice(1);
    const candidates = extname(relative)
      ? [relative]
      : [relative, `${relative}/index.html`];
    const exists = await Promise.any(
      candidates.map((candidate) => access(resolve(dist, candidate), constants.R_OK).then(() => true)),
    ).catch(() => false);
    if (!exists) throw new Error(`Enlace interno roto en ${htmlFile}: ${rawHref}`);
  }
}

const home = await readFile(resolve(dist, "index.html"), "utf8");
if (
  !home.includes("UROCLINIC") ||
  !home.includes("Urología con Enfoque Funcional y Regenerativo") ||
  !home.includes("/contacto#solicitud")
) {
  throw new Error("La página principal compilada no contiene la marca, el enfoque o el CTA esperado.");
}

const cssFiles = (await readdir(resolve(dist, "_astro"))).filter((file) => file.endsWith(".css"));
if (cssFiles.length === 0) throw new Error("El build no contiene CSS compilado.");

console.log(
  `Build verificado: ${expected.length} rutas/activos, ${htmlFiles.length} HTML y ${cssFiles.length} CSS; enlaces y SEO correctos.`,
);

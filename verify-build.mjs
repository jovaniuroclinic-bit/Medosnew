import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const dist = resolve("apps/web/dist");
const expected = [
  "index.html",
  "servicios/index.html",
  "programas/index.html",
  "contacto/index.html",
  "privacidad/index.html",
  "404.html",
  "favicon.svg",
  "site.webmanifest",
];

for (const relativePath of expected) {
  await access(resolve(dist, relativePath), constants.R_OK);
}

const home = await readFile(resolve(dist, "index.html"), "utf8");
if (!home.includes("UROCLINIC") || !home.includes("/contacto#solicitud")) {
  throw new Error("La página principal compilada no contiene la marca o el CTA esperado.");
}

console.log(`Build verificado: ${expected.length} rutas/activos esenciales presentes.`);

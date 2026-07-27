import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: process.env.SITE_URL ?? "https://drjovaniurologo.org",
  trailingSlash: "never",
  compressHTML: true,
  integrations: [],
  vite: {
    define: {
      "process.env.CLINICAL_DATA_ALLOWED": JSON.stringify("false"),
      "process.env.PERSISTENCE_ENABLED": JSON.stringify("false"),
    },
  },
  build: {
    inlineStylesheets: "auto",
    format: "directory",
  },
  server: {
    host: "127.0.0.1",
    port: 3000,
  },
  preview: {
    host: "127.0.0.1",
    port: 3000,
  },
});

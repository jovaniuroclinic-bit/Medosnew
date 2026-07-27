/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_ENV?: "preview" | "production";
  readonly PUBLIC_FORM_MODE?: "preview" | "production";
  readonly PUBLIC_INTAKE_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

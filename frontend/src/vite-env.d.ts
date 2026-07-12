/// <reference types="vite/client" />

// Type the custom env var so import.meta.env.VITE_API_URL is typed (not `any`).
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

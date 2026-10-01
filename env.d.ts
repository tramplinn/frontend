/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** `true` — показать переключатель RU/EN (до публичного запуска — только для команды). */
  readonly VITE_LOCALE_SWITCHER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

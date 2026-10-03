/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.BACKEND_ORIGIN ?? 'http://localhost:8000'

  return {
    plugins: [vue()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      // Проксируем на бэкенд, чтобы в дев-режиме фронт и API жили на одном origin:
      // refresh-кука с path=/api/v1/auth уходит без CORS-исключений.
      proxy: {
        '/api': { target: backendUrl, changeOrigin: true },
      },
    },
    test: {
      // e2e/*.e2e.ts гоняет Playwright против живого стенда, не vitest.
      include: ['src/**/*.spec.ts'],
      setupFiles: ['src/__tests__/setup.ts'],
    },
  }
})

import { defineConfig, devices } from '@playwright/test'

/* Smoke-тесты навигации против живого стенда (фронт + бэкенд с сидами).
   В make check не входят — нужен поднятый бэкенд; запуск: make e2e.
   E2E_BASE_URL — уже запущенный фронт; без него поднимается vite dev.
   E2E_BROWSER_CHANNEL=chrome — системный Chrome вместо скачанного Chromium. */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173'
const channel = process.env.E2E_BROWSER_CHANNEL

export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts',
  forbidOnly: process.env.CI !== undefined,
  reporter:
    process.env.CI !== undefined ? [['list'], ['junit', { outputFile: 'e2e-report.xml' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], ...(channel ? { channel } : {}) },
    },
  ],
  ...(process.env.E2E_BASE_URL
    ? {}
    : {
        webServer: {
          command: 'pnpm dev',
          url: baseURL,
          reuseExistingServer: process.env.CI === undefined,
        },
      }),
})

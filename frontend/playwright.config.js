// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // Test lokal boleh parallel.
  // CI dibuat 1 worker karena banyak test mengubah database.
  fullyParallel: false,

  forbidOnly: !!process.env.CI,

  // Retry hanya di CI
  retries: process.env.CI ? 1 : 0,

  // CI: 1 worker supaya database tidak bentrok
  workers: process.env.CI ? 1 : undefined,

  // Jangan sampai satu test menggantung terlalu lama
  timeout: 60 * 1000,

  // Maksimal seluruh test suite di CI 15 menit
  globalTimeout: process.env.CI ? 15 * 60 * 1000 : 0,

  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never' }]]
    : 'html',

  use: {
    baseURL: 'http://127.0.0.1:5173',

    trace: 'on-first-retry',

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',

    actionTimeout: 15 * 1000,

    navigationTimeout: 30 * 1000,
  },

  projects: process.env.CI
    ? [
        // GitHub Actions cukup Chromium.
        // Firefox + WebKit tetap dijalankan saat development lokal.
        {
          name: 'chromium',
          use: {
            ...devices['Desktop Chrome'],
          },
        },
      ]
    : [
        {
          name: 'chromium',
          use: {
            ...devices['Desktop Chrome'],
          },
        },

        {
          name: 'firefox',
          use: {
            ...devices['Desktop Firefox'],
          },
        },

        {
          name: 'webkit',
          use: {
            ...devices['Desktop Safari'],
          },
        },
      ],

  // Frontend dijalankan otomatis kalau belum hidup.
  //
  // Di GitHub Actions backend dan frontend memang sudah
  // dijalankan dari workflow, jadi Playwright akan memakai
  // server yang sudah tersedia.
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
import { defineConfig, devices } from '@playwright/test';

// Di lingkungan yang sudah punya Chromium terpasang, set PW_CHROMIUM_PATH agar tidak perlu `playwright install`.
const executablePath = process.env.PW_CHROMIUM_PATH;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:4173/GymRatEX/',
    trace: 'off',
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], launchOptions: executablePath ? { executablePath } : {} },
    },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/GymRatEX/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});

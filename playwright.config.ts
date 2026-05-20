import { defineConfig, devices } from '@playwright/test'
import { config } from './helpers/config'
import { webBotAuthHeaders } from './helpers/web-bot-auth'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: config.shopifyStoreUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-signed',
      use: {
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: webBotAuthHeaders(),
      },
    },
  ],
})

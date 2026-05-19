import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // importante: Shopify rate-limita requests paralelos
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // una sola sesión para evitar 429s en el dev store
  reporter: 'html',
  use: {
    baseURL: process.env.SHOPIFY_STORE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
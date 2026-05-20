import { chromium, FullConfig } from '@playwright/test'
import { config } from './helpers/config'
import * as fs from 'fs'
import * as path from 'path'

export default async function globalSetup(_playwrightConfig: FullConfig) {
  const authDir = 'playwright/.auth'
  fs.mkdirSync(authDir, { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto(config.shopifyStoreUrl)
  await page.locator('[name="password"]').fill(config.storefrontPassword)
  await page.locator('[type="submit"]').click()
  await page.waitForURL(url => !url.pathname.endsWith('/password'))

  await page.context().storageState({ path: path.join(authDir, 'storefront.json') })
  await browser.close()
}

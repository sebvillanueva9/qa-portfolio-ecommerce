import { test, expect } from '../../fixtures/test'
import { HomePage } from '../../pages/HomePage'

test('@smoke homepage renders with heading and navigation', async ({ page }) => {
  const home = new HomePage(page)
  await page.goto('/')
  await expect(home.hero).toBeVisible()
  await expect(home.nav).toBeVisible()
})

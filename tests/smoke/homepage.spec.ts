import { test, expect } from '../../fixtures/test'

test('store homepage loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/.+/)
  await expect(page.locator('body')).toBeVisible()
})

import { type Page, type Locator } from '@playwright/test'

export class HomePage {
  readonly header: Locator
  readonly hero: Locator
  readonly nav: Locator
  readonly footer: Locator

  constructor(page: Page) {
    this.header = page.getByRole('banner')
    this.hero = page.getByRole('heading', { level: 1 })
    this.nav = page.getByRole('navigation', { name: 'Main menu' })
    this.footer = page.getByRole('contentinfo')
  }
}

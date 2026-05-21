import { test as base, expect } from '@playwright/test'
import type { StorefrontApiClient } from '@shopify/storefront-api-client'
import { createSignedStorefrontClient } from '../clients/storefront-client'

export { expect }
export const test = base.extend<Record<string, never>, { storefrontApi: StorefrontApiClient }>({
  storefrontApi: [
    async ({}, use) => {
      await use(createSignedStorefrontClient())
    },
    { scope: 'worker' },
  ],
})

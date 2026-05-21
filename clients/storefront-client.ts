import { createStorefrontApiClient, type StorefrontApiClient } from '@shopify/storefront-api-client'
import { config } from '../helpers/config'
import { webBotAuthHeaders } from '../helpers/web-bot-auth'

const STOREFRONT_API_VERSION = '2026-01'

function signedFetch(url: URL | string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  for (const [key, value] of Object.entries(webBotAuthHeaders())) {
    headers.set(key, value)
  }
  return fetch(url, { ...init, headers })
}

export function createSignedStorefrontClient(): StorefrontApiClient {
  return createStorefrontApiClient({
    storeDomain: config.shopifyStoreUrl.replace(/\/$/, ''),
    apiVersion: STOREFRONT_API_VERSION,
    publicAccessToken: config.storefrontAccessToken,
    customFetchApi: signedFetch,
  })
}

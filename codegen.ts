import 'dotenv/config'
import type { CodegenConfig } from '@graphql-codegen/cli'

const storeUrl = process.env.SHOPIFY_STORE_URL?.replace(/\/$/, '')
const accessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN

if (!storeUrl || !accessToken) {
  throw new Error('SHOPIFY_STORE_URL and SHOPIFY_STOREFRONT_ACCESS_TOKEN must be set for codegen')
}

const apiVersion = '2026-01'

const config: CodegenConfig = {
  schema: [
    {
      [`${storeUrl}/api/${apiVersion}/graphql.json`]: {
        headers: {
          'X-Shopify-Storefront-Access-Token': accessToken,
        },
      },
    },
  ],
  documents: 'tests/**/*.graphql',
  generates: {
    'generated/storefront.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
    },
  },
}

export default config

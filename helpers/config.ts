import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  shopifyStoreUrl: z.string().url(),
  // Dev Dashboard app credentials — Admin token is fetched at runtime via client_credentials grant
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  // Storefront API public token — static, generated once via storefrontAccessTokenCreate mutation
  storefrontAccessToken: z.string().min(1),
  // Storefront password — dev store only, found in Online Store > Preferences > Password protection
  storefrontPassword: z.string().min(1),
  // Web Bot Auth headers — issued by Shopify under Online Store > Preferences > Crawler access
  webBotSignature: z.string().min(1),
  webBotSignatureInput: z.string().min(1),
  webBotSignatureAgent: z.string().default('"https://shopify.com"'),
  // Test data
  testEmailDomain: z.string().min(1),
  bogusGatewayCard: z.string().default('1'),
})

export type Config = z.infer<typeof schema>

function loadConfig(): Config {
  const result = schema.safeParse({
    shopifyStoreUrl: process.env.SHOPIFY_STORE_URL,
    clientId: process.env.SHOPIFY_CLIENT_ID,
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET,
    storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    storefrontPassword: process.env.SHOPIFY_STOREFRONT_PASSWORD,
    webBotSignature: process.env.SHOPIFY_SIGNATURE,
    webBotSignatureInput: process.env.SHOPIFY_SIGNATURE_INPUT,
    webBotSignatureAgent: process.env.SHOPIFY_SIGNATURE_AGENT,
    testEmailDomain: process.env.TEST_EMAIL_DOMAIN,
    bogusGatewayCard: process.env.BOGUS_GATEWAY_CARD,
  })

  if (!result.success) {
    const messages = result.error.issues
      .map(issue => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Config validation failed:\n${messages}`)
  }

  return result.data
}

export const config = loadConfig()

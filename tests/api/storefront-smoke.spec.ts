import { print } from 'graphql'
import { test, expect } from '../../fixtures/test'
import { GetFirstProductDocument, type GetFirstProductQuery } from '../../generated/storefront'

test('@smoke storefront: product query returns typed product data', async ({ storefrontApi }) => {
  const { data } = await storefrontApi.request<GetFirstProductQuery>(print(GetFirstProductDocument))

  expect(data?.products.edges).toHaveLength(1)

  const { node } = data!.products.edges[0]
  expect(node.id).toBeTruthy()
  expect(node.title).toBeTruthy()
  expect(node.handle).toBeTruthy()
})

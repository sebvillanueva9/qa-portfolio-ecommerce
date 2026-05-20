# Customer-authenticated flows are out of scope

## Context

The dev store is configured with Shopify's **New Customer Accounts**. The auth model is OAuth 2.0 + passwordless email codes:

- Login pages live on `shop.app` / `account.shopify.com`, not on the storefront domain — so **Web Bot Auth does not apply** (same boundary problem as checkout).
- There is no password field by default. Login requires the customer to enter an email, then enter a 6-digit code Shopify emails them.
- The Storefront `customerAccessTokenCreate` mutation is officially deprecated and applies only to legacy Classic accounts.

Automating login therefore requires one of:

1. An email-code retrieval service (e.g. Mailosaur, Mailpit) to fetch the magic code and submit it
2. Full Customer Account API OAuth 2.0 flow automation in tests

Either approach adds significant infrastructure that exceeds the budget of this portfolio framework. The value-per-line-of-code is poor compared to deeper coverage of guest flows.

## Decision

The framework tests guest flows only:

- Storefront browsing (home, PLP, PDP, search, navigation, cart)
- Guest checkout via the Hybrid Checkout Test pattern (ADR 0001)
- Post-condition order verification via Admin API
- Storefront API queries (signed with Web Bot Auth)

Account-bound features — order history UI, address book, saved payment methods, customer-specific pricing, password reset — are **deliberately excluded**. The README documents this as a scope decision, not a missing feature.

## Considered Options

- **Mailosaur-based email-code retrieval for a handful of `@auth-ui` tests** — deferred. Could be added later without disturbing the core framework if portfolio scope grows.
- **Full Customer Account API OAuth automation in tests** — rejected. Turns the framework into an OAuth-automation framework, dilutes the QA-engineering narrative.
- **Switch dev store to Classic accounts** — rejected. Builds the framework on deprecated APIs and signals that the modern auth model was avoided.
- **Multipass** — rejected. Shopify Plus only; the dev store is on a Partner plan.

## Consequences

- No `LoginPage`, `AccountPage`, `OrderHistoryPage`, or `AddressBookPage` page objects.
- No `authenticatedCustomer` fixture. Tests that need a customer record interact with it only via Admin API.
- The framework cannot validate UI behavior gated on `customer.isLoggedIn`. This is an honest scope limit.
- If the portfolio ever needs to extend to authenticated flows, the first task is to integrate an email-retrieval service and add `@auth-ui` tagged tests — the architecture supports it without restructuring.

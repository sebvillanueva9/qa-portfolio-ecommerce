# Hybrid checkout test strategy

## Context

Shopify's **Web Bot Auth** signs storefront and Storefront API requests and lifts the May-2026 strict rate-limit tier. Per Shopify's docs, signatures **do not grant access to Shopify Checkout** — checkout has its own bot-protection layer that does not honor Web Bot Auth headers. A single signed transport cannot drive a full checkout test end-to-end.

## Decision

Checkout tests are split into two phases:

1. **Cart Assembly Phase** — signed Storefront API calls (`cartCreate`, `cartLinesAdd`, `cartBuyerIdentityUpdate`, etc.) build cart state up to the `checkoutUrl` Shopify returns. Fast, deterministic, signed with Web Bot Auth.
2. **Checkout Completion Phase** — a headed Playwright browser navigates to the `checkoutUrl` with a real Chrome user agent and real-human timing. No signature is attached (it wouldn't be honored anyway). The browser drives **Bogus Gateway** to a confirmation page.

Post-condition assertion is then done via **Admin API** against the resulting `Order` resource.

## Considered Options

- **Full UI E2E with stealth fingerprinting** (`playwright-extra` + stealth plugin or hand-rolled fingerprint masking) — rejected. Brittle, high-maintenance, and likely to break on Shopify-side anti-bot updates.
- **No UI checkout — Admin API only** — rejected. Doesn't test checkout behavior; tests the test author's model of it.
- **Scope checkout out entirely** — rejected. Undermines the portfolio narrative; checkout is the most distinctive part of any commerce SUT.

## Consequences

- Two fixtures are required: a signed Storefront client (for Cart Assembly) and an unsigned browser context (for Checkout Completion).
- The Checkout Completion Phase will be slower and somewhat more flaky than API-only steps. We accept this in exchange for testing real customer-facing behavior.
- If Shopify ever extends Web Bot Auth scope to checkout, ADR 0001 should be revisited — the split becomes unnecessary.

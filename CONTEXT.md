# QA Portfolio: Shopify Commerce Test Framework

A Playwright + TypeScript automation framework that exercises a Shopify dev store (Dawn theme) end-to-end. The **SUT** is the customer-facing commerce surface — homepage, product listing, product detail, cart, **guest** checkout, and Storefront API — not Shopify's platform itself, and **not** customer-authenticated flows (see Scope below).

## Scope

**In scope:**
- Storefront browsing (home, collection/PLP, product/PDP, search, navigation)
- Cart operations via UI and Storefront API
- Guest checkout via the **Hybrid Checkout Test** pattern
- Post-condition order verification via Admin API
- Storefront API queries (signed with **Web Bot Auth**)

**Out of scope (deliberate):**
- **Customer authentication flows.** The store is configured with Shopify's New Customer Accounts (OAuth + passwordless email codes). Automating these requires either an email-code retrieval service (Mailosaur/Mailpit) or full Customer Account API OAuth flow automation. Both exceed the budget of this portfolio. Documented in the README as a deliberate scope decision.
- Account-bound features that depend on auth: order history UI, address book, saved payment methods, customer-specific pricing.
- Checkout customization extensions (Shopify Plus only).
- Multipass (Shopify Plus only).

## Language

### Test data lifecycle

**Test Customer**:
A Shopify `Customer` created for the lifetime of a single test, identified by a unique email of shape `test+${runId}-${testId}@<domain>`.
_Avoid_: "test user", "fake account", "dummy customer".

**Test Order**:
A Shopify `Order` created during a test via **Bogus Gateway** checkout. Always associated with a **Test Customer**. Cleaned up at run teardown.
_Avoid_: "fake order", "stub order", "dry-run order".

**Run ID**:
A UUID generated once per Playwright invocation, embedded in every **Test Customer** email created during that run. Lets **Admin Cleanup** target only this run's data.

**Bogus Gateway**:
Shopify's built-in test payment processor (enabled in store settings). Accepts specific magic card numbers and completes real `Order` records without charging a card. The only payment path tests use.
_Avoid_: "fake gateway", "mock payment".

**Admin Cleanup**:
The `globalTeardown` step that queries the **Admin API** for **Test Customers** matching this **Run ID** and deletes them (cascading to their **Test Orders**). The primary cleanup mechanism.

**Flow Safety Net**:
A Shopify Flow rule that auto-cancels orders matching the test email pattern. A backup to **Admin Cleanup**, not the primary mechanism — distinguishes this framework from the Our Place production pattern, which relies on the Flow alone.

### Shopify entities (as we use them)

**Customer**:
A Shopify `Customer` record — the canonical buyer identity. Tests always operate on a **Test Customer**, never an arbitrary or shared one.
_Avoid_: "user", "account", "buyer", "shopper".

**Order**:
A Shopify `Order` record produced by a completed **Checkout**. The canonical record of "a sale happened."
_Avoid_: "purchase", "transaction", "sale" (when referring to the record).

**Reserved Product**:
A product persisted in the dev store admin that is tagged `qa:test-data` and managed as part of the framework's **Test Data Contract**. Tests reference Reserved Products by tag, not by handle, so they survive renames. Examples: a single-variant product, a multi-variant product, an out-of-stock product, a discounted product.

**Test Data Contract**:
The set of assumptions about Reserved Products that tests rely on: which tags exist, what the tagged products' shapes look like (variant counts, inventory, pricing tiers). Validated at session start by a fixture that fails fast if the contract is broken.

### Test surfaces

**Storefront API**:
Shopify's public, customer-facing GraphQL API. Read-mostly, used to query products/collections and to drive cart operations. Authenticated with a Storefront API token (low-privilege).

**Admin API**:
Shopify's privileged GraphQL/REST API. Used by this framework only in **Admin Cleanup** and for **post-condition verification** of UI flows (e.g., asserting an Order exists with the right line items after a UI checkout). Authenticated with an Admin API token (high-privilege, kept out of `.env` committed files).

### Bot authorization

**Web Bot Auth**:
Shopify's sanctioned mechanism for letting authorized crawlers and automated tools access the storefront without tripping bot detection or hitting the May-2026 strict rate-limit tier. Configured in Shopify admin under **Online Store → Preferences → Crawler access**. Generates three required HTTP headers that must be attached to every request from this framework:
- `Signature-Input`
- `Signature`
- `Signature-Agent: "https://shopify.com"`

**Signature**:
A short-lived credential (max 3 months) issued by Shopify for a specific connected domain. Non-renewable — must be rotated and re-distributed before expiry. Stored in `.env` (or CI secrets), never committed.

**Checkout exclusion**:
**Web Bot Auth signatures do not grant access to Shopify Checkout.** Checkout has its own, stricter bot-protection layer. This is a hard constraint that splits the framework's request strategy in two: storefront/Storefront-API requests carry **Signature** headers; **Checkout** requests do not.

### Checkout architecture

**Cart Assembly Phase**:
The signed, API-driven phase of a checkout test. The framework uses **Storefront API** (`cartCreate`, `cartLinesAdd`, `cartBuyerIdentityUpdate`, etc.) with the **Web Bot Auth** signature attached to build the cart state up to the point where Shopify hands back a `checkoutUrl`. Fast, deterministic, signed.

**Checkout Completion Phase**:
The unsigned, browser-driven phase. A real headed Playwright browser navigates to the `checkoutUrl` produced by the **Cart Assembly Phase**, uses real Chrome UA and real-human timing, and drives **Bogus Gateway** to a confirmation page. No **Web Bot Auth** signature attached (it wouldn't be honored here anyway). This is the leg most exposed to Shopify's checkout-specific bot detection.

**Hybrid Checkout Test**:
A test that exercises both phases. Cart is built fast via the **Cart Assembly Phase**; the **Checkout Completion Phase** verifies UI behavior and produces a **Test Order**; **post-condition verification** then asserts the resulting Order via **Admin API**.

## Relationships

- A **Test Customer** creates one or more **Test Orders** during a test
- Every **Test Order** has a financial status from **Bogus Gateway** (`paid`, `pending`, etc.)
- **Admin Cleanup** deletes **Test Customers** by **Run ID**, which cascades to their **Test Orders**
- The **Flow Safety Net** catches **Test Orders** that escape **Admin Cleanup**
- **Post-condition verification** uses the **Admin API** to inspect entities the test created via the UI or **Storefront API**

## Example dialogue

> **Dev:** "After this E2E checkout test, should I assert against the DOM that the order summary shows the right total?"
> **QA:** "DOM assertion is fine for the user-visible state, but also verify the **Test Order** via the **Admin API** — that's the canonical truth. The DOM can lie; the **Order** record can't."

> **Dev:** "Can two tests share a **Test Customer** if they're testing the same flow?"
> **QA:** "No. Every test owns its **Test Customer** and its **Run ID** scope. Sharing reintroduces the state-coupling problem we explicitly designed away from when we rejected the Our Place pattern."

## Flagged ambiguities

- "test user" / "test account" / "test buyer" were all used early — resolved: **Test Customer** is the canonical term, distinguishing the Shopify entity from a logged-in browser session.
- "fake order" vs "real order via Bogus Gateway" was ambiguous — resolved: there is no "fake" order. Bogus Gateway creates **real** Shopify `Order` records; "fakeness" is only at the payment-processing layer.
- "bot detection workaround" was discussed as a single mechanism — resolved: there are **two distinct surfaces**. Storefront and Storefront-API requests use **Web Bot Auth**. **Checkout** requests cannot use Web Bot Auth (per Shopify docs) and require a separate strategy — currently **unresolved**.

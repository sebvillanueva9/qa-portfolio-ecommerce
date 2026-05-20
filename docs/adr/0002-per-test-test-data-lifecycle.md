# Per-test isolated test data lifecycle

## Context

Every test that touches checkout produces a real `Order` via **Bogus Gateway**, accumulates `Customer` state (`orderCount`, `totalSpent`, tags), and briefly looks real to downstream systems before any cleanup. A common production pattern (the one used at Our Place: a single shared test email + Shopify Flow auto-cancel) couples tests through that customer's growing state, makes concurrent runs collide, breaks per-run traceability ("which CI build created these orders?"), and depends on Flow remaining healthy.

A portfolio framework can do strictly better, and demonstrating that judgment is itself part of the portfolio value.

## Decision

Every test owns its own **Test Customer**, identified by an email of the form `test+${runId}-${testId}@<domain>`. The **Run ID** is a UUID generated once per Playwright session and embedded in every customer email created during that run.

Cleanup happens via Admin API in `globalTeardown`: query all customers whose email matches `test+${runId}-*` and delete them, which cascades to their orders. The existing **Flow Safety Net** (auto-cancel by email pattern) is retained as belt-and-suspenders for orders that escape `globalTeardown`, but it is no longer the primary mechanism.

## Considered Options

- **Mirror the Our Place pattern** (single shared test email + Flow auto-cancel) — rejected. Customer state drifts across tests; concurrent tests collide; orders briefly look real for ~1 minute before cancellation; no per-run traceability.
- **Per-run unique emails, no cleanup** — rejected. Dev store accumulates customers and orders unboundedly; degrades over time.
- **Per-run product creation + customer creation via Admin API for every run** — rejected. Adds significant setup time and Admin API rate-limit pressure for marginal isolation gain.
- **Mutate-and-accept with manual cleanup** — rejected. Not portfolio-quality.

## Consequences

- The framework hard-requires Admin API access (separate access token, scoped for `read_customers`, `write_customers`, `read_orders`, `write_orders`).
- The Admin API token is high-privilege and never committed; stored only in `.env` (local) and CI secrets.
- Each test pays the cost of one customer creation via Admin API at start. Acceptable; sub-second.
- Tests can later be safely parallelized (raising Playwright `workers` above 1) without state collisions — a future capability that the Our Place pattern would have foreclosed.

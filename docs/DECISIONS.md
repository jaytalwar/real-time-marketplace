# Engineering Decisions Log

Short-form record of the scope/architecture calls made during the NEXUS
upgrade, per the spec's own rule ("explain trade-offs before a major
architectural change"). Full context for each is in `docs/ARCHITECTURE.md` §12.

| Date | Decision | Choice | Why |
|---|---|---|---|
| 2026-09-01 | Database | **Stay on MongoDB**, do not migrate to PostgreSQL | Nothing in the codebase audit requires relational modeling at this data scale; migrating would be the highest-risk, highest-effort item in the spec for no unlocked capability. Revisit only if the goal becomes specifically demonstrating relational schema design. |
| 2026-09-01 | Graph intelligence | **MongoDB-native** (`$graphLookup` + in-memory adjacency), not a dedicated graph database | Covers every relationship the spec lists at this scale, no new external account needed. Neo4j Aura remains an option later if the résumé line matters more than the engineering necessity. |
| 2026-09-01 | Demand forecasting data | **Generate clearly-labeled synthetic seed data** (not yet implemented — banked for when the forecasting phase is built) | Real order history is too sparse for a meaningful train/val/test split today. Synthetic data must be disclosed everywhere it's used, never presented as real usage metrics. |
| 2026-09-01 | Round 1 scope | **Correctness + real-time hardening only** — not pricing, recommendations, AI tool-calling, or analytics this round | 16 phases built shallowly in one pass would not survive interview follow-up questions. Chose to build fewer things correctly, tested, and explainable, starting with the foundation everything else depends on. |
| 2026-09-03 | Round 2 scope | **Pricing intelligence + recommendation engine**, explicitly requested next | Both were buildable on real data with zero new infrastructure (per `docs/ARCHITECTURE.md` §12's own recommendation for "what to build next"), and both give the AI assistant real capability to wire into later, rather than adding surface area for its own sake. |
| 2026-09-03 | Pricing signals | Real signals only (inventory level, own recent sales velocity) — **no competitor-price driver** | No real data source for competitor pricing exists; fabricating one would violate the spec's own rule against faking analytics/ML data. |

## What "Round 1" actually shipped

See `EXPLANATION.md` for the full narrative. Summary:

- Service layer (`server/services/`) extracted from controllers, which were
  previously talking to Mongoose directly.
- Centralized error handling (`server/middleware/errorHandler.js`) + Zod
  request validation at the route boundary — previously every controller
  hand-rolled its own `try/catch`.
- **Fixed a real overselling race condition** in order creation using a
  MongoDB multi-document transaction with an atomic `$gte`-guarded stock
  decrement, plus retry-on-write-conflict handling. Verified with a live
  concurrency test (see `EXPLANATION.md`).
- **Fixed `getAllOrders` returning every order in the marketplace to any
  seller** — sellers now only see orders containing their own products;
  admins keep full visibility. Verified live.
- **Fixed Redis being invalidate-only** (`flushdb()` on every write, nothing
  ever actually cached) — implemented real read-through caching with a
  cache-version key for list queries and targeted invalidation for product
  detail. Verified via `X-Cache: miss` → `X-Cache: hit` on repeated requests.
- **Added idempotency-key support** to order creation so a retried/double-
  submitted checkout request replays the original order instead of creating
  a duplicate. Verified live (same order ID returned on retry).
- **Hardened real-time behavior**: clients now re-join Socket.io rooms on
  reconnect (previously a dropped connection silently stopped receiving
  updates), added live inventory-change events on the product page, and a
  live "new order" feed for sellers — with basic socket-level authorization
  so a client can't join another seller's private room.

## What "Round 2" actually shipped

- **Pricing insight** (`GET /api/products/:id/pricing-insight`, seller-owner
  or admin only) — explainable rule-based price suggestion from real
  inventory and sales-velocity signals, with the raw numbers behind every
  driver included in the response. Verified live against both a
  low-inventory test product (+8%) and an excess-inventory test product
  (-6%), plus a 403 check against another seller's product.
- **Recommendation engine** (`GET /api/products/:id/recommendations`,
  public) — real candidate generation (co-purchase from `Order.items` +
  same-category) → weighted ranking → business rules (exclude out-of-stock,
  exclude self). Replaces the old "related products" section, which was
  just same-category-sorted-by-views. Verified live: a cross-category test
  product with real co-purchase history outranked a same-category
  popularity-only product.
- **A UI bug found by testing, not reading**: the "Apply suggested price"
  button silently submitted the whole product-edit form (native `<button>`
  defaults to `type="submit"` inside a `<form>`). Fixed at the shared
  `Button` component level, not just the one call site.

## Known debt intentionally not touched this round

Documented in `docs/CODEBASE_AUDIT.md` §7, not addressed here because they
fall outside the chosen scope:

- `server/.env` committed to git history with real credentials (public repo)
  — flagged repeatedly, rotation is the user's action to take.
- `client.zip` (20MB) committed at the repo root.
- No price snapshot on `Order.items` — order totals can drift from current
  product price with no record of what was actually charged.
- No automated tests beyond the concurrency/idempotency checks run manually
  against a live server during this session (not yet committed as a
  repeatable test suite — see `EXPLANATION.md` for what a follow-up test
  suite should cover).

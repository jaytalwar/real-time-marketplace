# Codebase Audit — Real-Time Marketplace ("Kartly" → proposed "NEXUS")

Audited on branch `feat/marketplace-redesign-ai-assistant`, commit `8e31ba7`.
This document describes what exists **today**, verified by reading the actual
code — not aspirational. No code was changed to produce this document.

---

## 1. High-level shape

A two-service MERN app:

- `client/` — React 19 SPA (Vite 8, React Router 7, Tailwind v4)
- `server/` — Node/Express 5 REST API + Socket.io, MongoDB (Mongoose), Redis (Upstash)

There is no monorepo tooling (no Turborepo/Nx/workspaces) — `client` and `server`
are two independent npm projects with their own `node_modules` and `package.json`,
linked only by the REST API contract and a shared `CLIENT_URL`/`VITE_API_URL` env pair.

No infrastructure-as-code, no CI config, no Dockerfiles, no tests exist anywhere
in the repo (confirmed: the only `*.test.js` files found are inside `node_modules`).

---

## 2. Frontend architecture

| Aspect | Current state |
|---|---|
| Framework | React 19 + Vite 8, `@vitejs/plugin-react` |
| Routing | `react-router-dom` v7, single `App.jsx` route table under one `MainLayout`, route-level `React.lazy` code-splitting |
| Styling | Tailwind v4 (`@tailwindcss/vite` plugin, CSS-based `@theme` tokens in `style.css`) — no CSS-in-JS, no component library |
| State | Two React Contexts: `AuthContext` (JWT + user profile, `localStorage`-backed) and `CartContext` (client-only cart, `localStorage`-backed, **not persisted server-side**) |
| Data fetching | Plain `axios` instance (`services/api.js`) with a request interceptor that attaches `Authorization: Bearer <token>`. No React Query/SWR — each page manages its own `useState`/`useEffect` fetch, no caching, no request de-duplication |
| Real-time | Single shared `socket.io-client` instance (`socket/socket.js`), used only on the Orders page to join per-order rooms and listen for `orderStatusUpdated` |
| AI | `services/aiService.js` calls two backend endpoints (`/ai/assistant`, `/ai/generate-description`); a floating chat widget + dedicated `/assistant` page render the responses |
| Build output | Route-level code splitting keeps the initial JS bundle at ~226KB gzip; `SellerDashboard` (which pulls in `recharts`) is the only chunk over Vite's 500KB warning threshold, and it's lazy-loaded only for sellers |

**Pages that exist:** Home, Products (search/filter/sort/paginate), Product detail,
Cart, Checkout, Orders (role-aware: buyer sees own orders, seller/admin see all),
SellerDashboard, AddProduct, EditProduct, Login, Register, Assistant, NotFound.

**No pages/flows exist for:** payments (checkout is "Cash on Delivery" only, no
payment gateway integration), reviews/ratings (no backing data model), wishlists,
multi-image product galleries, seller-scoped order views (see §7), search-as-you-type,
address management, notifications (in-app or push).

---

## 3. Backend architecture

Plain Express 5 app (`server.js`) — no framework-level layering beyond
`routes/ → controllers/`. There is **no service layer**: controllers talk directly
to Mongoose models. `server/services/` exists as an empty directory (dead
scaffold, never used).

| Domain | Route file | Controller | Notes |
|---|---|---|---|
| Auth | `authRoutes.js` | `authController.js` | register/login/me, bcrypt password hashing, JWT issuance |
| Products | `productRoutes.js` | `productController.js` | CRUD, search/category/price filters, pagination, seller-scoped `my-products` |
| Orders | `orderRoutes.js` | `orderController.js` | create (multi-item, stock-decrementing), buyer's own orders, all orders (seller/admin), status update (emits socket event) |
| AI | `aiRoutes.js` | `aiController.js` | Added in this session — Claude Messages API via `fetch`, no SDK dependency. Seller-only description generator; public assistant chat with optional structured "search filters" or per-product Q&A context |

**Middleware:** `authMiddleware.js` — `protect` (JWT verify → attaches `req.user`),
`authorize(...roles)` (role allowlist). No rate limiting, no request validation
library (no Zod/Joi/express-validator — validation is ad hoc `if (!x)` checks
in a few controllers, absent in others), no centralized error handler (every
controller repeats its own `try/catch` → `res.status(500).json({ message })`).

**Real-time:** `socket/socket.js` is a 13-line module holding a single module-level
`io` reference (`initializeSocket`/`getIO`), so any file can emit without threading
the `io` instance through. Client `joinOrder`s a room per order id; server emits
`orderStatusUpdated` to that room on status change. This works for the single-server
case but has no adapter (e.g. `@socket.io/redis-adapter`) for horizontal scaling —
if the server ever runs on more than one instance, a client connected to instance A
won't receive an event emitted by instance B.

**Caching:** `config/redis.js` connects to Upstash Redis via `ioredis`. The only
usage found is `await redis.flushdb()` inside `getProductById` and `deleteProduct`
— i.e. Redis is wired up but is being used to **invalidate** a cache that is never
actually **populated** anywhere in the code I read. This is either incomplete
work or a caching layer that regresses to zero benefit (every read still hits
Mongo; every write pays a full-database `FLUSHDB` even though it likely only
needs to invalidate one key). Worth confirming with the project owner before
assuming this is "working caching."

---

## 4. Database & schema (MongoDB / Mongoose)

Three collections, no others:

- **User** — `name, email (unique), password (bcrypt hash), role (enum: buyer/seller/admin, default buyer)`, timestamps.
- **Product** — `title, description, price, category (free-text string, not a ref), image (single URL string), stock, seller (ref User), views`, timestamps.
- **Order** — `buyer (ref User), items: [{ product: ref Product, quantity }], total, status (enum: Pending/Packed/Shipped/Out for Delivery/Delivered)`, timestamps.

Observations:
- No explicit indexes beyond Mongoose's automatic ones (`_id`, and the unique
  index implied by `email: { unique: true }`). Given `getProducts` filters/sorts
  on `title` (regex), `category`, `price`, and `-createdAt`/`-views`, there is
  **no index support** for any of those query patterns — this will degrade
  linearly as the catalog grows.
- `category` is a free-text string entered by sellers, not a normalized reference
  — two sellers typing `"Electronics"` vs `"electronics"` produce different
  facets in the UI (the frontend's category strip / filter sidebar is only as
  clean as sellers are consistent).
- No inventory/audit trail — `stock` is decremented in place inside `createOrder`
  with no ledger of *why* it changed, and no optimistic-concurrency guard (see §7).
- No reviews, no product-interaction/event log, no pricing-history, no cart
  persistence — the cart lives only in browser `localStorage`.
- `Order.items` stores only a product ref + quantity, not a price snapshot —
  if a seller changes `Product.price` after an order is placed, `Order.total`
  (computed once, at creation) and the live product price will diverge with no
  record of what was actually charged. This is a real correctness gap, not a
  style nit.

---

## 5. Authentication & authorization

- JWT, signed with `JWT_SECRET`, 7-day expiry (`generateToken.js`, `expiresIn: "7d"`).
- Passwords hashed with `bcryptjs`, cost factor 10.
- Role model is a single flat enum (`buyer | seller | admin`) stored directly on
  `User`, checked via `authorize(...roles)`. No fine-grained permissions, no
  seller-owns-resource checks beyond a manual `product.seller.toString() !== req.user._id.toString()`
  comparison duplicated in `updateProduct`/`deleteProduct`.
- No refresh tokens, no logout/revocation (logout is purely client-side
  `localStorage.removeItem`), no password reset flow, no email verification.

---

## 6. Real-time functionality (existing)

Already covered in §3. Summarizing the gap analysis against "production-grade
real-time" for Phase 3 of the NEXUS spec:

| Requirement | Status |
|---|---|
| Inventory updates pushed live | ❌ not implemented — stock changes are pull-only (re-fetch) |
| Order status pushed live | ✅ implemented, verified working end-to-end this session |
| Seller dashboard live updates | ❌ dashboard is fetch-on-mount only |
| Notifications | ❌ none |
| Reconnection handling | ❌ default socket.io-client reconnection only; rooms are **not re-joined** on reconnect (the `joinOrder` emit happens once, on the initial orders fetch — a dropped/reconnected socket silently stops receiving updates until the page is reloaded) |
| Idempotency on order creation | ❌ no idempotency key; a double-submit (e.g. double-click, retried request) creates two orders and decrements stock twice |
| Concurrent-purchase race safety | ❌ `createOrder` does `find` → check `stock < quantity` → `save()` with no transaction and no atomic decrement (`findOneAndUpdate` with a `$gte` guard); two simultaneous buyers can both pass the stock check and oversell |

---

## 7. Known technical debt / bugs found

1. **Overselling race condition** in `orderController.createOrder` — read-then-write
   on `Product.stock` with no atomicity. Two concurrent orders for the last unit
   of a product can both succeed.
2. **`getAllOrders` is not seller-scoped** — any user with role `seller` or `admin`
   sees *every* order in the marketplace, not just orders containing their own
   products. Flagged during the frontend redesign session; not yet fixed.
3. **Redis is invalidate-only** (see §3) — `flushdb()` on every product write with
   no corresponding read-path caching found.
4. **No price snapshot on `Order.items`** — historical order totals can silently
   drift from current product price with no record of the price actually charged.
5. **`server/.env` is committed to git history** since the initial commit, and the
   GitHub repo is public — `MONGO_URI`, `JWT_SECRET`, and the Upstash `REDIS_URL`
   (which embeds its own auth token) have been publicly exposed. **This predates
   the current session and is unrelated to the redesign work**, but it blocks any
   claim of "production-grade security" until rotated. Flagged twice already;
   repeating here so it's part of the permanent audit trail.
6. **`client.zip`** (20MB) is committed at the repo root and tracked in git —
   looks like an accidental commit of a local backup/export, not part of the
   working app. Bloats every clone.
7. **No request validation layer** — controllers trust `req.body` shape; a
   malformed `price` or `stock` (e.g. a string, or negative number) is written
   straight to MongoDB. `AddProduct`/`ProductForm` on the frontend coerces to
   `Number(...)` client-side, but nothing enforces this server-side.
8. **No centralized error handling** — every controller hand-rolls
   `try { ... } catch (e) { res.status(500).json({ message: e.message }) }`,
   which also means raw Mongoose/driver error messages (potentially including
   internal detail) can leak to API responses.
9. **`server/services/` is an empty, unused directory** — likely a leftover
   scaffold from an earlier planning pass.
10. **No tests** anywhere in the repo (confirmed by search).

---

## 8. What should be preserved as-is

- **Domain model shape** (User/Product/Order) is simple and correct for what it
  covers — the *fields* aren't wrong, they're just incomplete for the NEXUS
  feature set (no reviews, no price history, no interaction events, etc.).
- **JWT + role-based auth pattern** — sound approach, just needs hardening
  (expiry, revocation) not replacement.
- **Socket.io for real-time order status** — works correctly today (re-verified
  live in browser this session); needs reconnection/re-join hardening and a
  Redis adapter if the server is ever horizontally scaled, not a rewrite.
- **The redesigned frontend** (this session's work) — component structure
  (`ui/` primitives, `ProductForm`, `AssistantChat`, context-based cart/auth)
  is a reasonable foundation to build NEXUS's additional surface area on top of,
  rather than a candidate for rewrite.

## 9. What needs refactoring (not replacing)

- Move business logic out of controllers into a `services/` layer (the directory
  already exists, empty — this is exactly what it should hold): `productService`,
  `orderService`, `pricingService`, etc. This is a prerequisite for testing and
  for the event-driven work in later phases, since domain events should be
  raised from service methods, not scattered across controllers.
- Replace the ad hoc validation with a schema-validation library (e.g. Zod) at
  the route boundary.
- Add a single centralized Express error-handling middleware.
- Fix the stock-decrement race with either a MongoDB transaction (Mongo supports
  multi-document ACID transactions on a replica set, which Atlas provides) or an
  atomic `findOneAndUpdate({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })`.
- Scope `getAllOrders` to the requesting seller's own products (join through
  `items.product.seller`), reserving "see every order" for `admin` only.

## 10. What would require replacing something that currently works

This is the section to slow down on, per the NEXUS spec's own rule #1
("do not rewrite working code without justification") and rule #15 ("explain
trade-offs before a major architectural change"):

- **Migrating MongoDB → PostgreSQL.** The current schema is small (3 collections)
  and works. A relational rewrite is justified *if* the goal is specifically to
  demonstrate relational schema design, multi-table transactions, and SQL query
  optimization for a portfolio/interview narrative — but it is not required to
  build any of Phases 3–15. It is the single highest-risk, highest-effort item
  in the entire spec and touches every controller. See `docs/ARCHITECTURE.md`
  for the recommended default (keep MongoDB, justify Postgres only if you want
  the relational-modeling story specifically).
- **Introducing Kafka.** Requires a hosted Kafka cluster (Confluent Cloud,
  Upstash Kafka, etc. — a new external account) or self-hosting. Redis Streams
  (Redis is already provisioned) covers the spec's Phase 4 event requirements
  at a fraction of the operational cost, and is the more honest choice for a
  single-instance monolith.
- **Introducing a graph database (Neo4j, etc.).** New external account/infra.
  The relationships the spec lists (viewed, purchased, similar_to,
  frequently_bought_with) are all derivable from MongoDB documents/aggregation
  pipelines at this data scale — a real graph DB earns its complexity at a
  scale this project doesn't have yet.

---

## 11. Recommended migration strategy (summary)

1. Keep MongoDB as the system of record; add the new collections/fields the
   NEXUS spec needs (reviews, interaction events, price history) as new
   Mongoose models rather than migrating.
2. Extract a `services/` layer before adding any new domain logic, so new code
   has somewhere correct to live and old code becomes testable incrementally.
3. Fix the two concrete correctness bugs (overselling race, unscoped
   `getAllOrders`) before layering intelligence features on top of them —
   pricing/forecasting/recommendation systems built on top of a leaky inventory
   model will inherit that leak.
4. Introduce events (Phase 4) as a lightweight in-process/Redis-Streams
   mechanism first; this unlocks Phases 5–12 (pricing, forecasting, recs,
   analytics, fraud) without new infra accounts.
5. Treat Postgres, Kafka, and a graph DB as **optional, explicitly-justified
   additions** the user can opt into per-component, not a wholesale platform
   swap.

Full proposed target architecture, with explicit scoping of which of the
spec's 16 phases are realistic to build for real vs. which need external
infra the user must provision, is in `docs/ARCHITECTURE.md`.

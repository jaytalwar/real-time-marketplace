# NEXUS (Kartly) — Project Explanation & Interview Guide

A living document. It's updated every time a new phase of the NEXUS upgrade
lands, and every claim in it is checked against the actual code before being
written — nothing here is aspirational or fabricated. Where something isn't
built yet, it says so explicitly under **Roadmap**, not folded into the
feature list as if it existed.

Two prior planning docs feed into this one: `docs/CODEBASE_AUDIT.md` (what
existed before this upgrade) and `docs/ARCHITECTURE.md` (the target design
and the trade-offs behind it). This document is the narrative version —
written to be read out loud in an interview.

---

## 1. Elevator pitch

A real-time e-commerce marketplace: buyers browse and buy from multiple
sellers, sellers manage listings and fulfill orders, and every order status
change is pushed live to the buyer's screen over WebSockets — no polling, no
refresh. On top of that sits a Claude-powered AI shopping assistant that
turns natural-language questions into real product searches, grounded
entirely in the application's own data (it cannot invent a price, a stock
level, or a product that doesn't exist).

Stack: React 19 + Vite + Tailwind v4 on the frontend; Node/Express 5 +
MongoDB (Mongoose) + Redis (Upstash) + Socket.io on the backend; Claude
(Anthropic API) for the AI layer.

---

## 2. What actually exists today (feature by feature)

### Buyer-facing
- **Home** — hero, category browsing (derived from real product data, not a
  hardcoded list), a "trending" row sorted by real view counts, a "new
  arrivals" row sorted by real `createdAt`, full catalog grid.
- **Search & filters** (`/products`) — text search, category filter, price
  range, sort, pagination — all real query params hitting a real backend
  query, not client-side filtering of a pre-fetched list.
- **Product detail** — image, price, stock badge, quantity selector, and a
  live "ask AI about this product" panel. The stock badge updates live if
  another buyer purchases the last few units while you're looking at the
  page (see §5). Below that, two real recommendation sections — see
  "Recommendation engine" below.
- **Cart & checkout** — client-side cart (localStorage-backed, survives a
  refresh), checkout creates a real order against the backend. Checkout is
  "Cash on Delivery" only — there's no payment gateway integration, and the
  UI doesn't pretend otherwise.
- **Order tracking** — a 5-step visual status stepper (`Pending → Packed →
  Shipped → Out for Delivery → Delivered`) that updates **live** via
  Socket.io when a seller changes the order's status. No refresh needed —
  this was manually verified end-to-end: change status in a seller's browser
  tab, watch it update in a buyer's tab in the same second.
- **AI shopping assistant** — floating widget + dedicated `/assistant` page.
  Ask it something like "electronics under 2000" and it turns that into a
  real `GET /api/products` call with real filters, then shows real matching
  products inline in the chat.
- **Recommendation engine** — on every product page, "Frequently bought
  together" (real co-purchase counts computed from `Order.items`) and "You
  might also like" (category + popularity, business-rule-filtered to exclude
  out-of-stock items and the product itself). This replaced a much weaker
  original version that only did same-category-sorted-by-views — see §4.6.

### Seller-facing
- **Seller dashboard** — stat cards (product count, total stock, total
  views, low-stock count — all computed from real data, never fabricated),
  a real chart (Recharts) of views-by-product, and a searchable product
  table.
- **Add/Edit product** — full CRUD, with an "AI: generate description"
  button that calls Claude with the product's title/category and returns a
  draft description the seller can edit before saving, and a **pricing
  insight** panel (see §4.7) showing a suggested price with explainable
  drivers pulled from the product's own real stock/sales data, plus a button
  to apply it to the price field for review before saving.
- **Order management** — sellers see and update the status of orders **that
  contain their own products only** (this was a real bug — see §4 — sellers
  used to see every order in the marketplace).
- **Live new-order feed** — a seller's order list refreshes automatically the
  moment a buyer places an order containing one of their products, pushed
  over the same Socket.io connection used for status updates.

### Cross-cutting
- **Auth** — JWT (7-day expiry), bcrypt-hashed passwords, three roles
  (buyer/seller/admin). Role-gated routes both client-side (`ProtectedRoute`)
  and server-side (`protect`/`authorize` middleware).
- **AI assistant, extended** — every AI response is grounded: the model never
  states a price, stock count, or fact that didn't come from a real database
  query. This is enforced by design (the assistant's job is to produce
  *search filters*, and the actual product data always comes from a normal
  `getProducts` call, never from the model's own "knowledge").

---

## 3. Architecture at a glance

```
Browser (React SPA)
   │  REST (axios, JWT bearer)         │  WebSocket (socket.io-client)
   ▼                                    ▼
Express API ──────────────────── Socket.io server
   │  validated at the edge (Zod)       │  room-based: order:<id>, seller:<id>, product:<id>
   ▼                                    │
Service layer (server/services/)  ◄─────┘  (services emit domain events; socket layer subscribes)
   │
   ├── MongoDB (Mongoose) — system of record: Users, Products, Orders
   └── Redis (Upstash) — read-through cache (product list/detail) +
                          idempotency-key locks + cache-version keys
```

Controllers are thin: parse the request (already validated by Zod
middleware), call a service function, return the result. All business logic
— the transaction handling, the cache read-through, the authorization
checks beyond "is this role allowed to hit this route at all" — lives in
`server/services/`. This is a **modular monolith**, not microservices: one
deployable process, but the internal boundaries (services, not controllers,
own business logic) are drawn cleanly enough that any one of them could be
extracted into its own service later without a rewrite.

---

## 4. The hard problems, and how they were actually solved

This is the section to lean on in an interview — each of these is a real bug
that was found, reasoned about, fixed, and *proven* fixed with a live test,
not just asserted.

### 4.1 The overselling race condition

**The bug:** the original `createOrder` did a classic read-then-write: fetch
the product, check `if (product.stock < quantity)`, then `product.stock -=
quantity; await product.save()`. Between the read and the write, nothing
stops two concurrent requests from both reading "stock = 1", both passing the
check, and both writing — the second write clobbers the first, and you've
sold two units of something you only had one of.

**The fix:** two things, working together.

1. **Atomic decrement with a guard**, not read-then-write:
   ```js
   await Product.findOneAndUpdate(
     { _id: item.product, stock: { $gte: item.quantity } },
     { $inc: { stock: -item.quantity } },
     { returnDocument: "after", session }
   );
   ```
   MongoDB evaluates the filter and applies the update as one atomic
   operation at the database level. If two requests race, the database
   itself serializes them — one succeeds, the other's filter
   (`stock >= quantity`) simply no longer matches after the first one's
   decrement lands, so it returns `null` instead of a document.

2. **A multi-document transaction** wraps the per-item decrements and the
   `Order.create` together, because an order can contain multiple products
   and all of them need to succeed or none should — otherwise you could
   decrement stock for item A, then fail on item B, and be left with
   item A's stock wrongly decremented with no order to show for it. MongoDB
   Atlas clusters are always replica sets, so multi-document ACID
   transactions are available without any extra infrastructure.

3. **Retry on transient write conflicts.** Real contention (many requests
   hitting the same product document inside a transaction) surfaces from the
   MongoDB driver as a `TransientTransactionError` — the database explicitly
   asking the *whole transaction* to be retried, not a real failure. This
   was caught by testing, not anticipated in advance (see the "found by
   testing" note below) — the fix retries the whole transaction up to 5
   times with jittered backoff, and only when the error actually carries
   that label; a genuine "not enough stock" error is never retried, it's
   returned to the client immediately as a 409.

**Proof, not a claim:** stock was set to 1 on a test product, and 8 requests
were fired at it concurrently. Result: exactly one `201 Created`, seven clean
`409` "doesn't have enough stock" responses, final stock `0` — never
negative. Run again with the retry fix specifically to confirm the earlier
version's `500`s (from unhandled `TransientTransactionError`s under real
contention) were gone: same 1-success/7-clean-rejection result, zero 500s.

*Interview note:* if asked "how did you find the retry requirement," the
honest answer is: the first version of the transaction fix was logically
correct but incomplete — it didn't handle the driver's own retry signal, and
firing enough concurrent requests at it in a real test (not a thought
experiment) surfaced `500`s from unhandled `TransientTransactionError`s.
That's a good story precisely because it's a "wrote it, tested it under real
concurrency, found a gap, fixed it, re-tested it" loop — not "got it right
the first time from memory."

### 4.2 Idempotent order creation

**The bug:** no protection against a double-submitted checkout — a
double-click, or a client retrying after a timeout that actually succeeded
server-side, creates two separate orders and decrements stock twice for
something the buyer only meant to buy once.

**The fix:** the client generates a UUID once per checkout attempt
(`crypto.randomUUID()`, stable for the component's lifetime — a fresh
checkout page mount gets a fresh key) and sends it as an `Idempotency-Key`
header. The server:
1. Checks Redis for that key. If it maps to a real order ID already, it
   returns that same order (`200`, not `201` — nothing new was created).
2. If not, it acquires a short-lived lock (`SET key pending EX 30 NX`) so a
   *concurrent* duplicate (not just a sequential retry) gets a clean `409`
   "already being processed" instead of racing into a second transaction.
3. On success, the lock is overwritten with the real order ID and a 24-hour
   TTL, so any retry within that window replays the same result.

**Proof:** the same request, with the same `Idempotency-Key`, fired twice in
sequence — first response `201` with a new order ID, second response `200`
with the *exact same* order ID. No second order was created.

### 4.3 Redis: from "invalidate-only" to actually caching

**The bug:** the only Redis usage found in the original code was
`redis.flushdb()` on every product write. That's not caching — it's paying
the cost of a cache (extra network hop, extra failure mode) with none of the
benefit, because nothing was ever being read *from* the cache; every product
read still hit MongoDB directly.

**The fix:**
- **Product list queries** are cached with a **versioned key** — the cache
  key embeds a version number stored at `products:version`. Any write
  (create/update/delete) does a single `INCR` on that version, which
  instantly "invalidates" every previously-cached list query without
  needing to enumerate or scan for the specific keys to delete (which is
  hard, because list queries are parameterized by page/search/category/
  sort/price-range in combinations that are impractical to track
  individually). Old versioned keys simply age out via their TTL (60s).
- **Product detail** is cached per-ID with a **targeted `DEL`** on
  update/delete — no `flushdb`, only that one key is invalidated.
- **View counts are deliberately eventually-consistent** while served from
  cache: the real MongoDB `views` field is still incremented on every
  request (fire-and-forget, not blocking the response), but a cached
  response can show a view count up to the cache TTL old. This is a
  conscious trade-off, not an oversight — precise real-time view counts
  aren't worth a database write on every single page view, and this is
  exactly how popularity counters work at real scale (this is explicitly
  documented in the code, not hidden).

**Proof:** `X-Cache: miss` on the first request to a given query, `X-Cache:
hit` on the identical second request — a response header added specifically
so this is externally verifiable, not just something to take on faith.

### 4.4 Sellers seeing every order in the marketplace

**The bug:** `getAllOrders` had no seller-scoping at all — any authenticated
seller could call `GET /api/orders/all` and see every order placed by every
buyer for every seller's products, not just their own.

**The fix:** for non-admin requesters, the service first resolves the
requester's own product IDs (`Product.find({ seller: user._id
}).distinct("_id")`), then filters orders to only those containing at least
one of those product IDs. Admins keep unrestricted visibility, which is the
one role that's actually supposed to see everything.

**Proof:** a seller account that owns 2 products with 2 real orders against
them, in a database that also contains other sellers' orders, was confirmed
to see exactly those 2 orders and nothing else via `GET /orders/all`.

### 4.5 Real-time hardening: reconnection, live inventory, live seller feed

- **Reconnection re-join.** The original code joined a Socket.io room for
  each visible order exactly once, on the initial page load. If the socket
  ever disconnected and reconnected (network blip, laptop sleep, etc.),
  socket.io's client reconnects the *transport* automatically, but room
  membership does **not** survive that — the client silently stopped
  receiving order updates until a manual page reload. Fixed by listening for
  the client's own `"connect"` event (which fires on every reconnect, not
  just the first connect) and re-emitting all the join calls.
- **Live inventory on the product page.** When an order is created, the
  server now emits `inventory:changed` to a `product:<id>` room; the product
  page joins that room and refetches the product (updating the stock badge)
  when it fires — someone else buying the last few units updates your screen
  without a refresh.
- **Live new-order feed for sellers.** Sellers join a `seller:<id>` room;
  order creation emits `order:new` to every seller who has a product in that
  order, and the seller's Orders page refetches automatically.
- **Basic socket-level authorization**, added because the seller feed and
  order rooms carry information that shouldn't be joinable by an arbitrary
  client: joining `seller:<id>` requires a JWT (sent in the join payload,
  verified server-side) proving the caller *is* that seller (or an admin);
  joining an order's room requires being the buyer, a seller with an item in
  it, or an admin. `product:<id>` rooms stay open with no auth, since product
  info is public anyway.

### 4.6 Recommendation engine: candidate generation, ranking, business rules

The original "related products" section on the product page was a single
query: same category, sorted by views. That's not a recommendation engine,
it's a filter. The replacement follows the three-stage pipeline designed in
`docs/ARCHITECTURE.md` §8:

1. **Candidate generation, two sources merged.** *Co-purchase candidates*:
   every other product that has ever appeared in the same order as this one
   — computed as an in-memory adjacency count over `Order.items`
   (`Order.find({ "items.product": productId })`, then tally how often each
   other product ID shows up across those orders). *Category candidates*:
   other in-stock products in the same category. This is the MongoDB-native
   "graph query without a graph database" approach chosen in
   `docs/ARCHITECTURE.md` §10.
2. **Ranking.** `score = coPurchaseCount * 10 + views * 0.1 + (isNewListing
   ? 2 : 0)`. Co-purchase evidence is weighted an order of magnitude above
   raw popularity on purpose — a product two people actually bought together
   is stronger evidence of relevance than a product that's merely popular in
   the same category.
3. **Business rules.** Out-of-stock products are excluded (never recommend
   something that can't be bought), the source product itself is excluded,
   and the list is capped at the requested limit.

Each returned item carries an honest `recommendationReason` —
`"Frequently bought together"` if it came from real co-purchase data,
`"You might also like"` otherwise — so the frontend never implies stronger
evidence than actually exists. The frontend renders these as two separate
sections rather than one mixed grid, specifically so that distinction stays
visible to the shopper, not just in the API response.

**Proof:** a test product in a *different* category from a real product was
bundled into one order with that real product, generating a genuine
co-purchase signal. Querying recommendations for the real product returned
the cross-category test product ranked **above** a same-category product —
proof the co-purchase weighting is actually driving rank, not just falling
back to category filtering with extra steps.

### 4.7 Pricing intelligence: explainable, not a black box

Every driver is computed from the product's own real data — there is
deliberately no "competitor price" signal, because there's no real data
source for one in this system, and the spec this project follows explicitly
rules out fabricating a data source to fill that gap.

Two driver categories, each either fires or doesn't based on a clear
threshold (a product can show 0, 1, or 2 drivers — never more, so the
explanation never gets noisy):

- **Inventory pressure**: stock at or below 5 units → suggests a modest
  price increase ("demand may be outpacing available stock"); stock at or
  above 50 units with zero sales in the last 14 days → suggests a modest
  decrease ("a lower price could help move stock").
- **Demand velocity**: units sold in the last 14 days compared against the
  *seller's own* average across their other listings (not a marketplace-wide
  number, which would be skewed by unrelated categories) — meaningfully
  above average suggests a price increase; zero sales despite real view
  traffic suggests price may be a conversion barrier.

Adjustments are summed and clamped to a sane range (-10% to +15%), applied
to the current price, and rounded to a clean number. The response includes
the raw numbers behind every driver (`basedOn`), not just the prose, so a
seller (or an interviewer) can verify the suggestion by hand.

**Proof:** a low-stock test product correctly triggered the low-inventory
driver (+8%, `999 → 1080`); a separate high-stock/zero-sales test product
correctly triggered the excess-inventory driver (-6%, `499 → 469`); a
request against another seller's product correctly returned `403`.

### 4.8 A UI bug the tests caught before a real user would

`PricingInsight`'s "Apply suggested price" button lives inside the same
`<form>` as the rest of the product-edit fields. A native `<button>` with no
explicit `type` defaults to `type="submit"` — so the button didn't just fill
the price field for review, it silently submitted and saved the whole form.
This was caught by testing the feature in a real browser, not by reading the
code: clicking "Apply" navigated away with a "Product updated" toast instead
of just updating the field. Root-caused and fixed once, in the shared
`Button` component (default to `type="button"` unless a call site explicitly
asks for `type="submit"`), rather than patching the one call site — the
existing submit buttons already passed `type="submit"` explicitly, so the
safer default couldn't silently break them.

---

## 5. The AI layer, honestly described

Two real integrations, both calling the Anthropic Messages API directly via
`fetch` (no SDK dependency), both behind `POST /api/ai/*` routes that return
a clean `503` with an explanatory message if `ANTHROPIC_API_KEY` isn't set,
rather than crashing:

1. **Shopping assistant** (`/api/ai/assistant`) — the model is instructed
   (via system prompt) to respond with strict JSON: a short reply plus an
   optional `filters` object. If it decides the user is looking for
   products, the *frontend* takes those filters and makes a completely
   normal `getProducts` call — the model never sees or states real product
   data itself in that path, it only ever proposes a search. The same
   endpoint also handles per-product Q&A: when the frontend passes
   `productContext` (title/description/price/category/stock — the real
   fields from that one product), the system prompt instructs the model to
   answer only from what's given and to say so honestly if something isn't
   covered by the listing.
2. **Product description generator** (`/api/ai/generate-description`,
   seller-only) — given a title and category, returns a short draft
   description. Explicitly instructed not to invent specific technical
   specs, certifications, or brand claims.

**Why this design resists the classic "AI made something up" failure mode:**
the model is never the source of truth for a fact a user could act on (a
price, a stock count, an order status) — it only ever produces *parameters*
for a real query, or reasons over data explicitly handed to it in the
prompt. If asked "how do you stop the AI from hallucinating a price," the
honest answer is architectural, not a prompt trick: the code path that
returns prices to the user is always `getProducts`/`getProductById` against
the real database, never the model's own text output.

---

## 6. Security posture (as it actually stands)

What's real:
- JWT auth with expiry, bcrypt password hashing, role-based route
  authorization (client and server side).
- Request validation at the API boundary (Zod) — malformed input is rejected
  with a structured `400` before it reaches a controller.
- Centralized error handling — internal error details (stack traces, driver
  error messages) are never leaked to the client; only `AppError`s (with an
  intentional message and status code) or well-understood error shapes
  (`ZodError`, Mongoose `CastError`, Mongo duplicate-key `11000`) produce a
  specific message, everything else becomes a generic "something went wrong."
- Socket-level authorization for private rooms (§4.5).
- AI tool surface is narrow and fixed (§5) — the model can never issue
  arbitrary queries.

What's known and not yet fixed (see `docs/CODEBASE_AUDIT.md` for full list,
not hidden here):
- **`server/.env` is committed to git history in a public repo.** This
  predates the current work and has been flagged repeatedly. Rotate
  MongoDB/JWT/Redis credentials; this is unrelated to anything built this
  round but is the single most important action item outstanding.
- No rate limiting on auth or AI endpoints.
- No CSRF protection (acceptable for a bearer-token API consumed by a SPA,
  worth naming as a known scope boundary if asked).
- `client.zip` (20MB) is committed at the repo root — not a security issue,
  but worth mentioning as evidence of what a real cleanup pass would catch.

---

## 7. Roadmap (explicitly not built yet — do not claim these exist)

From the original 16-phase spec, still deliberately deferred (see
`docs/DECISIONS.md`) — **pricing intelligence and the recommendation engine
are now built** (§4.6-4.7) and no longer belong on this list:

- **Demand forecasting** — needs either more real order history or
  deliberately-labeled synthetic seed data (decision made in favor of
  synthetic data when this phase is picked up — see `docs/DECISIONS.md`);
  not implemented.
- **AI tool-calling loop** (compare products, look up a specific order,
  graph-based "frequently bought with") — the current assistant only does
  search-filter generation and single-product Q&A; it does not yet call the
  new pricing/recommendation services as tools, though both are now real
  endpoints it could call. The broader tool loop is designed in
  `docs/ARCHITECTURE.md` §9, not implemented.
- **Graph intelligence beyond co-purchase** — the co-purchase adjacency used
  by the recommendation engine (§4.6) *is* a real, if narrow, slice of the
  graph-intelligence phase (`viewed`/`purchased`/`frequently_bought_with`
  relationships, computed MongoDB-native per `docs/ARCHITECTURE.md` §10).
  Broader relationships (`similar_to` via embeddings, `compatible_with`,
  `manufactured_by`) are not implemented.
- **Analytics dashboard, observability endpoint, fraud/risk signals** — all
  designed, none implemented.

If asked in an interview "what would you build next," the honest and
strongest answer is: wiring the AI assistant to actually call the pricing
and recommendation services as tools (§9 in `docs/ARCHITECTURE.md`) — both
already exist as real endpoints, so this is now the cheapest way to make the
assistant meaningfully smarter, rather than more surface area for its own
sake.

---

## 8. Likely interview questions and how to answer them

**"Walk me through what happens when two people try to buy the last item at
the same time."**
→ Section 4.1. Lead with the atomic `findOneAndUpdate` + transaction, then
mention the retry-on-conflict fix as the part that was only discovered by
actually load-testing it, not by reasoning alone.

**"How does the real-time order tracking work end to end?"**
→ Section 3 diagram + 4.5. Buyer's browser joins a Socket.io room named
after the order ID (after proving they're allowed to); when a seller updates
status, the server emits to that room; the buyer's stepper component updates
without a refetch.

**"How do you know the AI isn't making things up?"**
→ Section 5's architectural argument: the model never *is* the data source
for anything factual, it only proposes queries or reasons over data it was
explicitly handed.

**"How does your recommendation engine actually work — is it ML?"**
→ Section 4.6. No ML, deliberately — it's a candidate-generation-then-
ranking pipeline over real co-purchase and category data, weighted so
genuine co-purchase evidence outranks raw popularity. Lead with the proof:
a cross-category test product outranked a same-category one once real
co-purchase data existed for it, which is direct evidence the ranking isn't
secretly just category filtering.

**"How do you justify the price change you're suggesting to a seller?"**
→ Section 4.7. Every driver is named, thresholded, and shown with the raw
numbers behind it (`basedOn` in the API response) — a seller can check the
math themselves. No competitor-price signal exists because there's no real
data source for one; naming that omission unprompted is stronger than
waiting to be asked why it's missing.

**"What would you do differently / what's the biggest weakness right now?"**
→ Section 6's honest list, led with the committed `.env` — it's real, it's
already been flagged to the project owner multiple times, and naming it
unprompted is a stronger answer than waiting to be asked.

**"Why MongoDB and not Postgres for something with orders/inventory?"**
→ `docs/ARCHITECTURE.md` §12 answer: the audit found nothing that actually
needs relational modeling at this scale, and the transaction fix in §4.1
proves MongoDB's multi-document ACID transactions are sufficient for the
concurrency-sensitive part of this domain. Migrating would be the single
highest-risk, highest-effort change available and doesn't unlock a
capability the app is missing.

**"Why a modular monolith instead of microservices?"**
→ It's one deployable unit today, but business logic lives in a services
layer with clean boundaries (not scattered across controllers), so any one
domain (orders, products, AI) could be extracted later without a rewrite —
paying the cost of the boundary now without paying the operational cost of
distributed systems before there's a real scaling reason to.

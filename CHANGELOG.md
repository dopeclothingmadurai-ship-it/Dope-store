# Changelog

All notable changes to Dope Store are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Premium admin dashboard redesign (UI only)

A visual overhaul of the admin into a premium dark SaaS dashboard. No business
logic, database, server action, or routing changes.

- New admin dark palette via CSS variables (bg `#090909`, surface `#111`, cards
  `#171717`, white accent, `#22c55e`/`#f59e0b`/`#ef4444` status). Storefront
  (light) theme untouched. Refined scrollbars and selection.
- New `AdminShell`: collapsible sidebar (persisted, animated) with brand, active
  indicator, elegant icons, user profile + logout at the bottom; a sticky top
  bar with breadcrumbs, product search and profile; mobile slide-in drawer.
- `rounded-2xl` cards with soft borders/shadow; premium tables (sticky header,
  subtle zebra, hover, refined typography and spacing); larger page titles;
  more generous page spacing.
- Premium login page: ambient gradient background, glass card, motion entrance.
- Real Dope Store brand mark (`public/dope-logo.png`, optimized) replaces the
  placeholder "D" in the sidebar and on the login page via a reusable
  `DopeLogo` component.
- Subtle Framer Motion (page transitions, sidebar, active-nav indicator, modal
  drawer) — professional, not flashy. Responsive across desktop/tablet/mobile;
  focus states, aria labels and keyboard access preserved.

### Phase 3 — Admin authentication & authorization

Secures the admin panel. Reuses the existing `is_staff()` system (no new
permission model).

**Added**

- Email/password login at `/login` (Supabase Auth) with validation, a loading
  state, and inline error handling. Only staff accounts are allowed — a valid
  but non-staff sign-in is rejected and signed back out.
- Logout from the admin sidebar (shows the signed-in user's email).
- Auth helpers (`src/lib/auth/`): `requireStaff` / `getAuthUser` /
  `isCurrentUserStaff`, and `runStaffAction` — a `runAction` wrapper that gates
  every admin mutation on staff.
- `features/auth` module (schema, actions, login form).

**Changed**

- Middleware now gates `/admin`: unauthenticated → `/login?next=…`,
  authenticated non-staff → `/login?error=unauthorized`. Session refresh is
  preserved. The admin layout re-checks the session (defense in depth) and
  surfaces the user; every admin Server Action now runs through
  `runStaffAction`.
- Admin data operations still use the service-role client behind the gate —
  existing admin functionality is unchanged.

**Verified**

- Unauthenticated `/admin` → 307 to `/login`; login works and lands in the
  admin; session persists across refresh; logout returns to `/login`; a
  non-staff account is rejected with a clear message. typecheck, lint, build
  all pass.

### Automatic SKU generation

- New reusable, pure SKU utility (`src/lib/sku.ts`) producing
  `DS-{PRODUCTCODE}-{COLOR}-{SIZE}-{SEQUENCE}` (e.g. `DS-HOOD-BLK-M-001`). The
  sequence runs per product-code + color across sizes, matching the spec.
- The variant form auto-fills the SKU when adding a variant and keeps it in
  sync with color/size until the admin edits it (manual override is preserved).
- The server generates the authoritative, guaranteed-unique SKU on create
  (retrying the sequence on a concurrent SKU collision). No SKU logic lives in
  components.
- Manual create/update perform an **application-level** SKU uniqueness check
  before writing (clear "This SKU is already in use." field error) rather than
  relying only on the DB error; the unique constraint remains the race-condition
  backstop. Editing a product title never changes existing SKUs — only new
  variants use the updated title.
- **Bug fix:** `product_variants` has three unique constraints (sku, barcode,
  and the (product_id, size, color) combo). Variant create/update now classify
  a `23505` by the violated constraint and return the correct field-level
  message, and the auto-SKU retry only loops on a true SKU collision (a
  duplicate size/color or barcode is rejected immediately).
- Verified against the live database: auto-generation, running sequence,
  new-scope reset, and correct rejection/classification for sku/barcode/combo.

### Phase 2 — Admin Catalog Foundation (enhancements)

Additive polish on top of the catalog module, continuing from the prior commit.

**Added**

- Top navigation bar with breadcrumbs on every admin route
  (`components/admin/breadcrumbs.tsx`).
- Route-level loading skeleton for the catalog pages (`catalog/loading.tsx`).
- Product list **column sorting** (Title / Price / Status) via URL params, on
  top of the existing search + pagination.
- Category list **search** and **reorder** (move up/down through
  `reorder_categories`).
- Inventory **Location** column on the variants table, and an **Inventory
  history** panel on the product editor showing every `adjust_inventory()`
  movement (date, SKU, change, reason, on-hand after, reference).
- `components/admin/link-button.tsx` — a `Link` styled as a button, replacing
  `<Button render={<Link/>}>` so navigation renders real anchors (removes Base
  UI's native-button warning across the admin).

**Verified**

- `typecheck`, `lint`, `format:check`, and `build` all pass. Live UI check:
  breadcrumbs, sortable headers, Location column, and inventory history all
  render correctly (seeded product exercised `adjust_inventory()`; test data
  cleaned up).

### Phase 2 — Admin Catalog Management

A complete, production-ready admin catalog module under `/admin/catalog`
(Products, Categories, Collections), plus the premium dark admin shell.

**Added**

- Additive migration (`..._catalog_phase2.sql`, applied to the hosted DB):
  `products.compare_at_price` (paise), `products.featured`, `products.tags`;
  `product_variants.weight_grams`; `categories.description` + `archived_at`;
  `collections.archived_at`. RLS updated so archived categories/collections
  (and their links) are hidden from public reads.
- Feature modules (`features/{products,categories,collections}`) each with
  `schema.ts` · `types.ts` · `queries.ts` · `service.ts` · `actions.ts` ·
  `components/` · `index.ts`. Business logic lives only in services; every
  mutation is a Zod-validated Server Action returning `Result<T>`.
- **Products:** full CRUD with title, slug (auto), description, brand, category,
  collections, status (draft/active), SEO, price + compare-at (integer paise),
  featured, tags; paginated + searchable list; **archive/restore only, no
  delete**. Image manager (direct-to-Storage signed uploads, drag-and-drop,
  multiple, drag-to-reorder, set primary, delete). Variants (SKU, barcode,
  size, color, price override, weight) with per-variant inventory display and
  adjustments made exclusively through `adjust_inventory()`.
- **Categories:** CRUD with image, position, description, archive/restore.
- **Collections:** CRUD (manual/automated, featured), product assignment with
  ordering, archive/restore.
- Shared foundation: `Result<T>` + typed errors + `runAction` wrapper, money
  helpers (paise), slug helper, signed-upload media module, reusable admin
  components (data tables, dialogs, price/tags inputs, image uploaders,
  confirm dialog, status badges), and the dark admin shell with Sonner toasts.

**Verified**

- Migration applied via `supabase db push`; types regenerated from the live
  schema. `npm run typecheck`, `npm run lint`, and `npm run build` all pass.
- Runtime smoke test: all admin routes render (200); an end-to-end category
  create through the real UI succeeded (Server Action → service → DB →
  revalidate → toast). Test data cleaned up.

**Changed**

- Disabled `next.config` `typedRoutes` (it broke standalone `tsc` typecheck once
  internal `Link`s existed; route hrefs are plain strings).

### Phase 1 — Core Data Layer

Database foundation only (catalog + inventory). No auth, orders, customers,
payments, storefront, or admin UI yet.

**Added**

- SQL migrations in `supabase/migrations/`:
  - `..._catalog.sql` — enums (`product_status`, `collection_type`), a shared
    `slug` domain, a shared `set_updated_at()` trigger, and the catalog tables:
    `categories`, `collections`, `collection_products` (M:N), `products`,
    `product_media`, `product_variants`. UUID PKs, FKs with appropriate
    `ON DELETE` rules, CHECK/UNIQUE constraints, and targeted indexes.
  - `..._inventory.sql` — `inventory` (1:1 with variants) and the append-only
    `inventory_movements` ledger; `adjust_inventory()` (row-locking,
    negative-stock-proof, ledger-writing); a guard trigger that blocks any
    direct write to `inventory.quantity`; a trigger that auto-provisions an
    inventory row (quantity 0) for every new variant.
  - `..._rls.sql` — `is_staff()` helper and RLS policies: public reads the
    active catalog only; staff get full CRUD; raw inventory and the ledger are
    staff-only.
  - `..._storage.sql` — `product-media` and `homepage-media` public buckets
    with staff-only write policies. No `review-media` bucket.
- Money stored as integer paise (`bigint`) throughout. Products are archive/
  restore only — there is no delete path.
- `src/types/database.ts` regenerated from the applied schema
  (`supabase gen types typescript --linked`).
- `supabase/config.toml` (project linked to the hosted project).

**Verified**

- Migrations applied to the hosted Supabase project via `supabase db push`
  (no Docker).
- Live smoke test (service-role) — 16/16 assertions passed: auto-provisioned
  inventory, `adjust_inventory()` increment/decrement, oversell and zero-delta
  rejection, guard blocking direct quantity writes, ledger snapshots,
  archived-consistency CHECK, unique SKU, and slug-domain validation. Test
  fixtures cleaned up.
- `npm run typecheck`, `npm run lint`, `npm run format:check`, and
  `npm run build` all pass.

### Phase 0 — Project Foundation

Production foundation only. No database tables, business logic, pages, server
actions, or API routes yet.

**Added**

- Next.js 15 (App Router) project with TypeScript strict mode, Tailwind CSS v4,
  and ESLint 9.
- Approved dependency set installed: Supabase (`supabase-js`, `ssr`),
  Framer Motion, React Hook Form + Zod (`@hookform/resolvers`), Razorpay,
  React Email (`@react-email/components` + CLI), Recharts, Lucide, Sonner,
  Zustand, date-fns, clsx, tailwind-merge, `server-only`.
- shadcn/ui configured (`components.json`, Nova/Lucide preset, `cn` helper,
  base `button` primitive).
- Complete feature-based folder structure (15 feature modules, route groups,
  shared `lib`/`components`/`config`/`types`).
- Three strictly separated Supabase clients — browser, server (cookie/RLS), and
  service-role admin. Admin client is `server-only` and cannot be imported by
  Client Components.
- Supabase session-refresh middleware.
- Zod-validated environment configuration, split into public (`env/client.ts`)
  and server-only secret (`env/server.ts`) schemas.
- Dual theme system via CSS variables: light luxury **storefront** theme and
  premium dark **admin** theme, plus brand/status/analytics tokens.
- Tooling: stricter `tsconfig`, ESLint rules (`no-explicit-any`,
  consistent type imports, unused-vars), Prettier + Tailwind plugin,
  `typecheck`/`format` scripts.
- `next.config.ts`: typed routes, AVIF/WebP images, Supabase Storage remote
  patterns.
- Documentation: `README.md`, `PROJECT_RULES.md`, `CHANGELOG.md`, `.env.example`.

**Verified**

- `npm run typecheck`, `npm run lint`, and `npm run build` all pass.

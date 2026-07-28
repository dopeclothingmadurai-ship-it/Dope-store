# Changelog

All notable changes to Dope Store are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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

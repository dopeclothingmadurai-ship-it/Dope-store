# Dope Store

Premium fashion e-commerce platform — a luxury storefront and a premium
dark-mode admin dashboard, built as a single production-grade Next.js
application backed by Supabase.

> **Status:** Phase 2 complete (admin catalog management: products, categories,
> collections). See [`CHANGELOG.md`](./CHANGELOG.md).

---

## Tech Stack

| Layer         | Technology                                        |
| ------------- | ------------------------------------------------- |
| Framework     | Next.js 15 (App Router, React 19, Server Actions) |
| Language      | TypeScript (strict)                               |
| Styling       | Tailwind CSS v4 + shadcn/ui                       |
| Animation     | Framer Motion                                     |
| Database/Auth | Supabase (PostgreSQL, Auth, Storage)              |
| Payments      | Razorpay                                          |
| Forms         | React Hook Form + Zod                             |
| Charts        | Recharts                                          |
| Email         | React Email                                       |
| Notifications | Sonner                                            |
| Client state  | Zustand                                           |
| Icons         | Lucide                                            |
| Deployment    | Vercel                                            |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A Supabase project and a Razorpay account (for live functionality)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# then fill in real values in .env.local

# 3. Start the dev server
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

> The repo ships with structurally-valid **placeholder** values in `.env.local`
> so it compiles out of the box. Replace them with real credentials before
> connecting to Supabase or Razorpay.

### Scripts

| Script                 | Description                        |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start the dev server               |
| `npm run build`        | Production build                   |
| `npm start`            | Run the production build           |
| `npm run lint`         | ESLint                             |
| `npm run typecheck`    | TypeScript, no emit                |
| `npm run format`       | Prettier write                     |
| `npm run format:check` | Prettier check                     |
| `npm run email:dev`    | React Email preview (order emails) |

---

## Environment Variables

See [`.env.example`](./.env.example) for the full list. Rules:

- `NEXT_PUBLIC_*` → exposed to the browser. **Never** put a secret here.
- Everything else → server-only secrets, validated in `src/lib/env/server.ts`
  (guarded by `server-only`).

Public env is validated in `src/lib/env/client.ts`. Both are Zod-validated at
load time, so a misconfigured deployment fails fast with a clear error.

---

## Project Structure

```
src/
├── app/
│   ├── (storefront)/     # public luxury storefront (light theme)
│   ├── (admin)/          # premium admin dashboard (dark theme)
│   ├── api/              # route handlers (webhooks only)
│   └── auth/             # auth callback routes
├── features/             # one folder = one domain module
│   ├── products/         #   actions.ts · service.ts · queries.ts
│   ├── orders/           #   schema.ts · types.ts · components/
│   ├── inventory/        #   (business logic lives here, only here)
│   └── … (15 modules)
├── components/
│   ├── ui/               # shadcn primitives
│   ├── storefront/       # shared storefront components
│   └── admin/            # shared admin components
├── lib/
│   ├── supabase/         # browser · server · admin clients + middleware
│   ├── env/              # validated client/server env
│   ├── razorpay/ · auth/ · errors/ · logger/ · validation/
│   └── utils.ts          # cn() and shared helpers
├── config/               # static app config (site, constants)
├── types/                # global + generated database types
└── middleware.ts         # Supabase session refresh
```

### Supabase clients

Three strictly separated clients live in `src/lib/supabase/`:

- **`client.ts`** — browser, RLS-scoped. Client Components / realtime only.
- **`server.ts`** — server, cookie-based, RLS-scoped. The default everywhere.
- **`admin.ts`** — service-role, **bypasses RLS**, `server-only`. Never
  importable by Client Components (build error if attempted). Trusted server
  flows only (e.g. Razorpay webhook).

---

## Database

The schema lives as SQL migrations in `supabase/migrations/` (the source of
truth) and is applied to the **hosted** Supabase project — local Docker is not
used.

**Catalog:** `categories` (single-level) · `collections` +
`collection_products` (M:N) · `products` (draft/active/archived, never deleted)
· `product_media` · `product_variants`.
**Inventory:** `inventory` (1:1 with variants) · `inventory_movements` (ledger).

Key invariants are enforced in Postgres, not just in the app:

- Money is integer paise (`bigint`); CHECK constraints keep it `>= 0`.
- `inventory.quantity` can only change via **`adjust_inventory()`** — a
  row-locking function that prevents negative stock and writes a ledger entry.
  A trigger blocks every other write path.
- Products archive/restore only; an `archived_at` consistency CHECK ties the
  timestamp to the `archived` status.
- RLS: the public reads only the active catalog; raw inventory and the ledger
  are staff-only.

**Apply migrations** (linked project, no Docker):

```bash
supabase db push
```

**Regenerate types** after any schema change:

```bash
supabase gen types typescript --linked --schema public > src/types/database.ts
```

---

## Admin

The admin lives under `/admin` (dark theme). Phase 2 ships the **Catalog**
module at `/admin/catalog`:

- **Products** — full CRUD, images (direct-to-Storage uploads, reorder, primary),
  variants, and per-variant stock. Products archive/restore only.
- **Categories** and **Collections** — CRUD with archive/restore; collections
  support product assignment and ordering.

Every mutation is a Zod-validated Server Action returning `Result<T>`; business
logic lives in each feature's `service.ts`; inventory changes go only through
`adjust_inventory()`.

> **Auth:** admin routes are not yet protected — that lands in Phase 3. Until
> then, admin Server Actions and reads use the server-side service-role client.

---

## Theming

Two themes are defined with CSS variables in `src/app/globals.css`:

- **Storefront** — `:root`, a warm light "luxury" palette.
- **Admin** — `.dark`, a deep premium dark-SaaS palette (added to the admin
  route-group layout in a later phase).

Never hard-code colors — always consume tokens via Tailwind utilities.

---

## Engineering Rules

This project follows a strict, locked set of engineering rules. Read
[`PROJECT_RULES.md`](./PROJECT_RULES.md) before contributing.

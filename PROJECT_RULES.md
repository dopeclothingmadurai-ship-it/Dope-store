# Dope Store — Engineering Rules

These rules are **locked**. They apply to every phase and every contributor
(human or AI). Do not deviate without an explicit decision to change them.

---

## 1. Non-negotiable rules

1. **Strict TypeScript.** `strict` is on, plus `noUncheckedIndexedAccess`,
   `noImplicitOverride`, `noFallthroughCasesInSwitch`. **Never use `any`** —
   ESLint enforces `@typescript-eslint/no-explicit-any: error`. Use `unknown`
   and narrow.
2. **Never duplicate logic.** Shared logic lives in one place and is reused.
   Online checkout, POS, and webhooks call the **same** services.
3. **Server Actions for mutations.** All writes go through a feature's
   `actions.ts`. The only HTTP route handlers are external integrations
   (Razorpay webhook, health check, auth callbacks).
4. **Business logic only inside services.** `actions.ts` is thin
   (`auth → validate → service → revalidate → Result`). `service.ts` holds the
   business rules and has **no `next/*` imports**.
5. **One feature folder = one module.** Features never reach into each other's
   internals — only into exported services/types.
6. **Always validate with Zod.** One schema per feature in `schema.ts`, shared
   by the form (client) and the action (server). No unparsed input reaches a
   service.
7. **Money is integer paise.** Stored as `bigint`, handled as integers, never
   floats. Formatted only at the edge (INR).
8. **Never hard delete products.** Archive → Restore only. Historical orders
   keep working via snapshots on `order_items`.
9. **Never trust client data.** The server re-prices carts, re-validates
   coupons, re-checks stock and authorization. Client-provided totals are
   advisory only.
10. **All inventory changes go through `adjust_inventory()`** — a single
    row-locking Postgres function backed by an audit ledger. No code writes the
    quantity column directly.
11. **Every completed feature is production-ready.** No `TODO` comments, no
    placeholder code, no mock data merged.
12. **Commit after every completed module**, with a clear conventional message.

---

## 2. Architecture

- **Clean architecture / layered:** Presentation → Server Actions →
  Service layer → Data access (Supabase / RPC) → PostgreSQL (RLS + functions +
  constraints as the final integrity backstop).
- **SOLID** where it earns its keep. Prefer composition over duplication.
- Database invariants (stock ≥ 0, totals, coupon limits) are enforced in
  Postgres, not just in TypeScript. TypeScript validates for UX; the database
  guarantees correctness.

---

## 3. Supabase client boundaries

| Client               | Scope                    | Use for                     |
| -------------------- | ------------------------ | --------------------------- |
| `supabase/client.ts` | Browser, RLS-scoped      | Client Components, realtime |
| `supabase/server.ts` | Server (cookies), RLS    | Default for all server code |
| `supabase/admin.ts`  | Service role, **no RLS** | Trusted server flows only   |

- `admin.ts` is `server-only`. It must **never** be imported by a Client
  Component. Prefer the RLS-scoped server client for everything possible.

---

## 4. Validation & errors

- Validate at every trust boundary; define the schema once and reuse it.
- Server Actions return a discriminated `Result` (`{ ok: true, data }` |
  `{ ok: false, error }`) — never throw raw across the boundary.
- Use typed error classes in the service layer; map them to safe, user-facing
  messages at the action boundary. Never leak stack traces or SQL to clients.

---

## 5. Naming & structure conventions

- Files: `kebab-case` for folders, feature files named by role
  (`actions.ts`, `service.ts`, `queries.ts`, `schema.ts`, `types.ts`).
- Prefer `import type { … }` for type-only imports (enforced by ESLint).
- Consume theme colors via Tailwind tokens only — never hard-coded hex/oklch in
  components.
- Keep components in `components/ui` (shadcn primitives), `components/storefront`
  and `components/admin` (shared), or a feature's local `components/`.

---

## 6. Performance

- RSC by default; Client Components only where interactivity requires it.
- ISR + tag-based revalidation for catalog and homepage.
- Targeted indexes; keyset pagination for large lists; select only needed
  columns (never `select('*')` on list views).
- `next/image` with AVIF/WebP for the image-heavy catalog.

---

## 7. Git workflow

- Work on feature branches off `main`.
- One focused commit per completed module; conventional commit messages.
- Never commit `.env.local` or real secrets. `.env.example` is the template.

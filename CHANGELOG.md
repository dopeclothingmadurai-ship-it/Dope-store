# Changelog

All notable changes to Dope Store are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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

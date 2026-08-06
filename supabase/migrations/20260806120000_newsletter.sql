-- =============================================================================
-- Storefront · Migration — Newsletter subscribers
-- -----------------------------------------------------------------------------
-- Additive only. Backs the footer newsletter signup so it genuinely persists
-- (never a decorative field). Anyone may subscribe; only staff can read the
-- list. Emails are stored normalized (lower-cased) and de-duplicated.
-- =============================================================================

create table if not exists public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  created_at timestamptz not null default now(),
  constraint newsletter_email_not_blank check (length(btrim(email)) > 0)
);
create unique index if not exists newsletter_subscribers_email_unique
  on public.newsletter_subscribers (email);

alter table public.newsletter_subscribers enable row level security;

-- Anyone may subscribe (insert only). No public read/update/delete.
drop policy if exists newsletter_insert_public on public.newsletter_subscribers;
create policy newsletter_insert_public
  on public.newsletter_subscribers for insert
  to anon, authenticated
  with check (true);

-- Staff may read the list (the trusted server also bypasses RLS).
drop policy if exists newsletter_select_staff on public.newsletter_subscribers;
create policy newsletter_select_staff
  on public.newsletter_subscribers for select
  to authenticated
  using (public.is_staff());

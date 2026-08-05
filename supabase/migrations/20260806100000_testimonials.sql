-- =============================================================================
-- Storefront · Migration — Testimonials
-- -----------------------------------------------------------------------------
-- Additive only. A staff-managed testimonials table, separate from product
-- `reviews`: these are hand-curated brand testimonials (name, quote, rating,
-- location, avatar, verified badge, featured flag, manual order) surfaced on
-- the storefront homepage. Managed from the admin; publicly readable when
-- published.
-- =============================================================================

create table if not exists public.testimonials (
  id                uuid primary key default gen_random_uuid(),
  customer_name     text not null,
  review            text not null,
  rating            integer not null default 5,
  location          text,
  avatar_url        text,
  verified_purchase boolean not null default false,
  featured          boolean not null default false,
  status            text not null default 'published',
  position          integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint testimonials_rating_range check (rating between 1 and 5),
  constraint testimonials_name_not_blank check (length(btrim(customer_name)) > 0),
  constraint testimonials_review_not_blank check (length(btrim(review)) > 0),
  constraint testimonials_status_valid check (status in ('published', 'hidden'))
);

-- Display order: manual position first, then featured, then newest.
create index if not exists testimonials_display_idx
  on public.testimonials (position asc, created_at desc)
  where status = 'published';

drop trigger if exists testimonials_set_updated_at on public.testimonials;
create trigger testimonials_set_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();

-- --- RLS ---------------------------------------------------------------------
alter table public.testimonials enable row level security;

-- Anyone may read published testimonials (storefront).
drop policy if exists testimonials_select_published on public.testimonials;
create policy testimonials_select_published
  on public.testimonials for select
  to anon, authenticated
  using (status = 'published');

-- Staff manage everything (the service-role server also bypasses RLS).
drop policy if exists testimonials_all_staff on public.testimonials;
create policy testimonials_all_staff
  on public.testimonials for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

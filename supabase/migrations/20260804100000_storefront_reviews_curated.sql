-- =============================================================================
-- Storefront · Migration — Curated Fits toggle + product reviews
-- -----------------------------------------------------------------------------
-- Additive only.
--   products.show_in_curated_fits : one boolean, set from the product editor,
--     that decides whether a product appears in the homepage "Curated Fits".
--   reviews : customer product reviews (rating + text, optional images). The
--     homepage Testimonials read published reviews rated >= 5; the product page
--     shows all published reviews including any customer-uploaded images.
-- =============================================================================

-- --- Curated Fits toggle -----------------------------------------------------
alter table public.products
  add column if not exists show_in_curated_fits boolean not null default false;

create index if not exists products_curated_fits_idx
  on public.products (created_at desc)
  where show_in_curated_fits and status = 'active';

-- --- reviews -----------------------------------------------------------------
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  author_name text not null,
  rating      integer not null,
  body        text not null,
  image_urls  text[] not null default '{}'::text[],
  status      text not null default 'published',
  created_at  timestamptz not null default now(),
  constraint reviews_rating_range check (rating between 1 and 5),
  constraint reviews_author_not_blank check (length(btrim(author_name)) > 0),
  constraint reviews_body_not_blank check (length(btrim(body)) > 0),
  constraint reviews_status_valid check (status in ('published', 'hidden'))
);
create index if not exists reviews_product_idx
  on public.reviews (product_id, created_at desc);
create index if not exists reviews_published_rating_idx
  on public.reviews (rating desc, created_at desc) where status = 'published';

-- --- RLS ---------------------------------------------------------------------
alter table public.reviews enable row level security;

-- Anyone may read published reviews (product pages + homepage testimonials).
drop policy if exists reviews_select_published on public.reviews;
create policy reviews_select_published
  on public.reviews for select
  to anon, authenticated
  using (status = 'published');

-- Staff manage everything (the trusted server also bypasses RLS).
drop policy if exists reviews_all_staff on public.reviews;
create policy reviews_all_staff
  on public.reviews for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

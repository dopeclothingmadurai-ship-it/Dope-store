-- =============================================================================
-- Phase 1 · Migration 1 — Catalog schema
-- -----------------------------------------------------------------------------
-- Enums, shared helpers, and the catalog tables:
--   categories · collections · collection_products ·
--   products · product_media · product_variants
--
-- Money is stored as integer paise (bigint). Never floats.
-- Products are never hard-deleted: draft -> active -> archived -> restore.
-- =============================================================================

-- --- Enums -------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'product_status') then
    create type public.product_status as enum ('draft', 'active', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'collection_type') then
    create type public.collection_type as enum ('manual', 'automated');
  end if;
end
$$;

-- --- Shared slug domain (single source of slug validation) -------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'slug') then
    create domain public.slug as text
      check (value ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  end if;
end
$$;

-- --- Shared updated_at trigger function --------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- --- categories --------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       public.slug not null,
  image_url  text,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_not_blank check (length(btrim(name)) > 0),
  constraint categories_position_nonneg check (position >= 0),
  constraint categories_slug_unique unique (slug)
);
create index if not exists categories_position_idx on public.categories (position);
drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- --- collections -------------------------------------------------------------
create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        public.slug not null,
  type        public.collection_type not null default 'manual',
  is_featured boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint collections_name_not_blank check (length(btrim(name)) > 0),
  constraint collections_slug_unique unique (slug)
);
create index if not exists collections_featured_idx
  on public.collections (is_featured) where is_featured;
drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

-- --- products ----------------------------------------------------------------
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            public.slug not null,
  description     text,
  brand           text,
  category_id     uuid references public.categories (id) on delete set null,
  status          public.product_status not null default 'draft',
  base_price      bigint not null,                 -- integer paise
  seo_title       text,
  seo_description text,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint products_title_not_blank check (length(btrim(title)) > 0),
  constraint products_base_price_nonneg check (base_price >= 0),
  constraint products_slug_unique unique (slug),
  -- archived_at is set exactly when the product is archived, and only then.
  constraint products_archived_consistency check (
    (status = 'archived' and archived_at is not null)
    or (status <> 'archived' and archived_at is null)
  )
);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_status_idx on public.products (status);
-- Fast storefront listing: only active products, newest first.
create index if not exists products_active_created_idx
  on public.products (created_at desc) where status = 'active';
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- --- collection_products (many-to-many) --------------------------------------
create table if not exists public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id    uuid not null references public.products (id) on delete cascade,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  constraint collection_products_position_nonneg check (position >= 0),
  primary key (collection_id, product_id)
);
create index if not exists collection_products_product_idx
  on public.collection_products (product_id);
create index if not exists collection_products_ordered_idx
  on public.collection_products (collection_id, position);

-- --- product_media -----------------------------------------------------------
create table if not exists public.product_media (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url        text not null,
  alt        text,
  position   integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint product_media_url_not_blank check (length(btrim(url)) > 0),
  constraint product_media_position_nonneg check (position >= 0)
);
create index if not exists product_media_ordered_idx
  on public.product_media (product_id, position);
-- At most one primary image per product.
create unique index if not exists product_media_one_primary_idx
  on public.product_media (product_id) where is_primary;

-- --- product_variants --------------------------------------------------------
create table if not exists public.product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products (id) on delete cascade,
  sku            text not null,
  barcode        text,                              -- column kept; no scanner in scope
  size           text,
  color          text,
  price_override bigint,                            -- integer paise; null = use base_price
  position       integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint product_variants_sku_not_blank check (length(btrim(sku)) > 0),
  constraint product_variants_price_override_nonneg
    check (price_override is null or price_override >= 0),
  constraint product_variants_position_nonneg check (position >= 0),
  constraint product_variants_sku_unique unique (sku),
  constraint product_variants_barcode_unique unique (barcode)
);
create index if not exists product_variants_product_idx
  on public.product_variants (product_id);
-- No duplicate size/color combination within a single product.
create unique index if not exists product_variants_combo_idx
  on public.product_variants (product_id, coalesce(size, ''), coalesce(color, ''));
drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

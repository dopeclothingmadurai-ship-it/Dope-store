-- =============================================================================
-- Phase 2 · Migration — Admin catalog fields + archive support
-- -----------------------------------------------------------------------------
-- Additive only. Does not rename, remove, or alter any Phase 1 object.
--   products         : compare_at_price (paise), featured, tags
--   product_variants : weight_grams
--   categories       : description, archived_at
--   collections      : archived_at
-- RLS updated so archived categories/collections (and their links) are hidden
-- from public reads.
-- =============================================================================

-- --- products ----------------------------------------------------------------
alter table public.products
  add column if not exists compare_at_price bigint,           -- integer paise
  add column if not exists featured boolean not null default false,
  add column if not exists tags text[] not null default '{}'::text[];

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_compare_at_price_nonneg'
  ) then
    alter table public.products
      add constraint products_compare_at_price_nonneg
      check (compare_at_price is null or compare_at_price >= 0);
  end if;
end
$$;

create index if not exists products_featured_idx
  on public.products (featured) where featured;
create index if not exists products_tags_gin_idx
  on public.products using gin (tags);

-- --- product_variants --------------------------------------------------------
alter table public.product_variants
  add column if not exists weight_grams integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'product_variants_weight_nonneg'
  ) then
    alter table public.product_variants
      add constraint product_variants_weight_nonneg
      check (weight_grams is null or weight_grams >= 0);
  end if;
end
$$;

-- --- categories --------------------------------------------------------------
alter table public.categories
  add column if not exists description text,
  add column if not exists archived_at timestamptz;

create index if not exists categories_active_position_idx
  on public.categories (position) where archived_at is null;

-- --- collections -------------------------------------------------------------
alter table public.collections
  add column if not exists archived_at timestamptz;

create index if not exists collections_active_idx
  on public.collections (id) where archived_at is null;

-- --- RLS: hide archived categories/collections from public -------------------
drop policy if exists categories_select_public on public.categories;
create policy categories_select_public
  on public.categories for select
  to anon, authenticated
  using (archived_at is null);

drop policy if exists collections_select_public on public.collections;
create policy collections_select_public
  on public.collections for select
  to anon, authenticated
  using (archived_at is null);

drop policy if exists collection_products_select_public on public.collection_products;
create policy collection_products_select_public
  on public.collection_products for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_products.collection_id
        and c.archived_at is null
    )
  );

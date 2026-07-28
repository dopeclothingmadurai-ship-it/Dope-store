-- =============================================================================
-- Phase 1 · Migration 3 — Row Level Security
-- -----------------------------------------------------------------------------
-- Public (anon + authenticated):
--   * read the ACTIVE catalog only (active products and their media/variants)
--   * read categories and collections
--   * NEVER read raw inventory numbers or the ledger
-- Staff:
--   * full CRUD across the catalog and inventory
--
-- "Staff" is centralized in is_staff(). In Phase 1 that means the trusted
-- server (service-role client, which also bypasses RLS). Phase 3 upgrades this
-- one function to recognize authenticated staff via staff_profiles — no policy
-- rewrites needed.
-- =============================================================================

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'service_role';
$$;

-- --- categories --------------------------------------------------------------
alter table public.categories enable row level security;

drop policy if exists categories_select_public on public.categories;
create policy categories_select_public
  on public.categories for select
  to anon, authenticated
  using (true);

drop policy if exists categories_write_staff on public.categories;
create policy categories_write_staff
  on public.categories for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- --- collections -------------------------------------------------------------
alter table public.collections enable row level security;

drop policy if exists collections_select_public on public.collections;
create policy collections_select_public
  on public.collections for select
  to anon, authenticated
  using (true);

drop policy if exists collections_write_staff on public.collections;
create policy collections_write_staff
  on public.collections for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- --- collection_products -----------------------------------------------------
alter table public.collection_products enable row level security;

drop policy if exists collection_products_select_public on public.collection_products;
create policy collection_products_select_public
  on public.collection_products for select
  to anon, authenticated
  using (true);

drop policy if exists collection_products_write_staff on public.collection_products;
create policy collection_products_write_staff
  on public.collection_products for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- --- products ----------------------------------------------------------------
alter table public.products enable row level security;

drop policy if exists products_select_public_active on public.products;
create policy products_select_public_active
  on public.products for select
  to anon, authenticated
  using (status = 'active');

drop policy if exists products_write_staff on public.products;
create policy products_write_staff
  on public.products for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- --- product_media -----------------------------------------------------------
alter table public.product_media enable row level security;

drop policy if exists product_media_select_public on public.product_media;
create policy product_media_select_public
  on public.product_media for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_media.product_id and p.status = 'active'
    )
  );

drop policy if exists product_media_write_staff on public.product_media;
create policy product_media_write_staff
  on public.product_media for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- --- product_variants --------------------------------------------------------
alter table public.product_variants enable row level security;

drop policy if exists product_variants_select_public on public.product_variants;
create policy product_variants_select_public
  on public.product_variants for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.status = 'active'
    )
  );

drop policy if exists product_variants_write_staff on public.product_variants;
create policy product_variants_write_staff
  on public.product_variants for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- --- inventory (staff only — raw stock is never public) ----------------------
alter table public.inventory enable row level security;

drop policy if exists inventory_all_staff on public.inventory;
create policy inventory_all_staff
  on public.inventory for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- --- inventory_movements (staff read only; writes only via adjust_inventory) -
alter table public.inventory_movements enable row level security;

drop policy if exists inventory_movements_select_staff on public.inventory_movements;
create policy inventory_movements_select_staff
  on public.inventory_movements for select
  to authenticated
  using (public.is_staff());

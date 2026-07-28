-- =============================================================================
-- Phase 1 · Migration 2 — Inventory engine
-- -----------------------------------------------------------------------------
--   inventory            1:1 with product_variants (fast, authoritative cache)
--   inventory_movements  append-only ledger (audit truth)
--   adjust_inventory()   the ONLY sanctioned path to change inventory.quantity
--
-- Enforcement (defense in depth):
--   * a guard trigger rejects any direct write to inventory.quantity
--   * every variant automatically gets an inventory row at quantity 0
--   * stock is then changed only via adjust_inventory(), which logs the ledger
-- =============================================================================

-- --- Enum: ledger reasons ----------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'inventory_movement_reason') then
    create type public.inventory_movement_reason as enum (
      'restock',
      'manual_adjustment',
      'correction',
      'sale',
      'return'
    );
  end if;
end
$$;

-- --- inventory ---------------------------------------------------------------
create table if not exists public.inventory (
  variant_id          uuid primary key
                       references public.product_variants (id) on delete cascade,
  quantity            integer not null default 0,
  reserved_quantity   integer not null default 0,
  low_stock_threshold integer not null default 0,
  location            text not null default 'default',
  updated_at          timestamptz not null default now(),
  constraint inventory_quantity_nonneg check (quantity >= 0),
  constraint inventory_reserved_nonneg check (reserved_quantity >= 0),
  constraint inventory_threshold_nonneg check (low_stock_threshold >= 0),
  constraint inventory_reserved_lte_quantity check (reserved_quantity <= quantity),
  constraint inventory_location_not_blank check (length(btrim(location)) > 0)
);
-- Dashboard low-stock widget: variants at or below their threshold.
create index if not exists inventory_low_stock_idx
  on public.inventory (variant_id) where quantity <= low_stock_threshold;
drop trigger if exists inventory_set_updated_at on public.inventory;
create trigger inventory_set_updated_at
  before update on public.inventory
  for each row execute function public.set_updated_at();

-- --- inventory_movements (append-only ledger) --------------------------------
create table if not exists public.inventory_movements (
  id             uuid primary key default gen_random_uuid(),
  variant_id     uuid not null references public.product_variants (id) on delete cascade,
  delta          integer not null,
  reason         public.inventory_movement_reason not null,
  reference      text,
  quantity_after integer not null,
  created_at     timestamptz not null default now(),
  constraint inventory_movements_delta_nonzero check (delta <> 0),
  constraint inventory_movements_qty_after_nonneg check (quantity_after >= 0)
);
create index if not exists inventory_movements_variant_idx
  on public.inventory_movements (variant_id, created_at desc);

-- --- Auto-provision an inventory row for every new variant -------------------
create or replace function public.create_inventory_for_variant()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.inventory (variant_id)
  values (new.id)
  on conflict (variant_id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_inventory_for_variant on public.product_variants;
create trigger create_inventory_for_variant
  after insert on public.product_variants
  for each row execute function public.create_inventory_for_variant();

-- --- Guard: inventory.quantity may only move via adjust_inventory() ----------
-- adjust_inventory() sets a transaction-local flag before its write; every
-- other write path (including the service-role client) is rejected.
create or replace function public.guard_inventory_quantity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.quantity <> 0
       and coalesce(current_setting('app.inventory_guard', true), '') <> 'adjust_inventory' then
      raise exception
        'inventory rows must start at quantity 0; add stock via adjust_inventory()'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.quantity is distinct from old.quantity
     and coalesce(current_setting('app.inventory_guard', true), '') <> 'adjust_inventory' then
    raise exception 'inventory.quantity may only be modified via adjust_inventory()'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_inventory_quantity on public.inventory;
create trigger guard_inventory_quantity
  before insert or update on public.inventory
  for each row execute function public.guard_inventory_quantity();

-- --- adjust_inventory(): the single inventory mutation path ------------------
create or replace function public.adjust_inventory(
  p_variant_id uuid,
  p_delta      integer,
  p_reason     public.inventory_movement_reason,
  p_reference  text default null
)
returns public.inventory
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.inventory;
begin
  if p_delta = 0 then
    raise exception 'adjust_inventory: delta must be non-zero'
      using errcode = '22023';
  end if;

  -- Lock this variant's inventory row for the duration of the transaction.
  select * into v_row
  from public.inventory
  where variant_id = p_variant_id
  for update;

  if not found then
    raise exception 'adjust_inventory: no inventory row for variant %', p_variant_id
      using errcode = 'P0002';
  end if;

  if v_row.quantity + p_delta < 0 then
    raise exception
      'adjust_inventory: insufficient stock for variant % (have %, delta %)',
      p_variant_id, v_row.quantity, p_delta
      using errcode = '23514';
  end if;

  if v_row.quantity + p_delta < v_row.reserved_quantity then
    raise exception
      'adjust_inventory: resulting quantity % would drop below reserved % for variant %',
      v_row.quantity + p_delta, v_row.reserved_quantity, p_variant_id
      using errcode = '23514';
  end if;

  -- Authorize exactly one guarded write, then apply it.
  perform set_config('app.inventory_guard', 'adjust_inventory', true);
  update public.inventory
  set quantity = quantity + p_delta
  where variant_id = p_variant_id
  returning * into v_row;
  perform set_config('app.inventory_guard', '', true);

  insert into public.inventory_movements
    (variant_id, delta, reason, reference, quantity_after)
  values
    (p_variant_id, p_delta, p_reason, p_reference, v_row.quantity);

  return v_row;
end;
$$;

-- Only the trusted server (service role) may call it. Phase 3 will extend
-- access to authenticated staff once staff_profiles exists.
revoke all on function
  public.adjust_inventory(uuid, integer, public.inventory_movement_reason, text)
  from public;
grant execute on function
  public.adjust_inventory(uuid, integer, public.inventory_movement_reason, text)
  to service_role;

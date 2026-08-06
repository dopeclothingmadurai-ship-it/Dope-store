-- =============================================================================
-- Orders · Migration — fulfillment type (delivery / pickup)
-- -----------------------------------------------------------------------------
-- Additive only. A single second fulfillment option alongside home delivery:
-- "Pick Up at Dope Store". Both live in the same orders table, share the same
-- payment/inventory/email flow — only the fulfillment method differs.
--
--   fulfillment_type : 'delivery' (default) | 'pickup'
--   pickup_status    : for pickup orders only —
--                      'pending' | 'ready_for_pickup' | 'collected'
-- =============================================================================

alter table public.orders
  add column if not exists fulfillment_type text not null default 'delivery',
  add column if not exists pickup_status text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_fulfillment_type_valid'
  ) then
    alter table public.orders
      add constraint orders_fulfillment_type_valid
      check (fulfillment_type in ('delivery', 'pickup'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_pickup_status_valid'
  ) then
    alter table public.orders
      add constraint orders_pickup_status_valid
      check (
        pickup_status is null
        or pickup_status in ('pending', 'ready_for_pickup', 'collected')
      );
  end if;
end
$$;

create index if not exists orders_fulfillment_type_idx
  on public.orders (fulfillment_type);

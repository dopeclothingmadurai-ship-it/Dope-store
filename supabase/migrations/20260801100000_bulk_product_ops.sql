-- =============================================================================
-- Phase 6 · Migration — Bulk product operations
-- -----------------------------------------------------------------------------
-- Additive only. Adds set-based, transactional RPCs for the bulk operations
-- whose per-row math cannot be expressed as a plain UPDATE from PostgREST:
--   * bulk_update_product_prices  — %/fixed/exact price changes, clamped >= 0
--   * bulk_edit_product_tags       — add/remove tags across many products
--   * bulk_adjust_product_inventory— set/increase/decrease stock for every
--     variant of the selected products, routed through adjust_inventory() so
--     the guard trigger and the movement ledger stay authoritative
--
-- Status / category / brand / collection / delete are single set-based
-- statements handled directly by the service-role client — no RPC needed.
-- All functions are SECURITY DEFINER and executable only by the trusted server.
-- =============================================================================

-- --- Bulk price update -------------------------------------------------------
-- p_value: integer percent for the _pct modes; integer paise for fixed/exact.
create or replace function public.bulk_update_product_prices(
  p_ids   uuid[],
  p_mode  text,
  p_value bigint
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_mode not in (
    'increase_pct', 'decrease_pct', 'increase_fixed', 'decrease_fixed', 'set_exact'
  ) then
    raise exception 'bulk_update_product_prices: unknown mode %', p_mode
      using errcode = '22023';
  end if;

  update public.products p
  set base_price = greatest(
    0,
    (case p_mode
      when 'increase_pct'   then round(p.base_price * (1 + p_value / 100.0))
      when 'decrease_pct'   then round(p.base_price * (1 - p_value / 100.0))
      when 'increase_fixed' then p.base_price + p_value
      when 'decrease_fixed' then p.base_price - p_value
      when 'set_exact'      then p_value
    end)::bigint
  )
  where p.id = any(p_ids);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- --- Bulk tag edit -----------------------------------------------------------
create or replace function public.bulk_edit_product_tags(
  p_ids  uuid[],
  p_tags text[],
  p_add  boolean
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_add then
    update public.products p
    set tags = (
      select coalesce(array_agg(distinct t), '{}')
      from unnest(p.tags || p_tags) as t
      where length(btrim(t)) > 0
    )
    where p.id = any(p_ids);
  else
    update public.products p
    set tags = (
      select coalesce(array_agg(t), '{}')
      from unnest(p.tags) as t
      where not (t = any(p_tags))
    )
    where p.id = any(p_ids);
  end if;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- --- Bulk inventory adjustment ----------------------------------------------
-- Applies to every variant of the selected products. 'decrease' never drops a
-- variant below zero; 'set' moves each variant to the exact target.
create or replace function public.bulk_adjust_product_inventory(
  p_ids   uuid[],
  p_mode  text,
  p_value integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row   record;
  v_delta integer;
  v_count integer := 0;
begin
  if p_mode not in ('set', 'increase', 'decrease') then
    raise exception 'bulk_adjust_product_inventory: unknown mode %', p_mode
      using errcode = '22023';
  end if;
  if p_value < 0 then
    raise exception 'bulk_adjust_product_inventory: value must be >= 0'
      using errcode = '22023';
  end if;

  for v_row in
    select i.variant_id, i.quantity
    from public.inventory i
    join public.product_variants pv on pv.id = i.variant_id
    where pv.product_id = any(p_ids)
  loop
    v_delta := case p_mode
      when 'set'      then p_value - v_row.quantity
      when 'increase' then p_value
      when 'decrease' then -least(p_value, v_row.quantity)
    end;

    if v_delta <> 0 then
      perform public.adjust_inventory(
        v_row.variant_id, v_delta, 'manual_adjustment', 'bulk'
      );
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

-- --- Grants: trusted server only --------------------------------------------
revoke all on function
  public.bulk_update_product_prices(uuid[], text, bigint) from public;
grant execute on function
  public.bulk_update_product_prices(uuid[], text, bigint) to service_role;

revoke all on function
  public.bulk_edit_product_tags(uuid[], text[], boolean) from public;
grant execute on function
  public.bulk_edit_product_tags(uuid[], text[], boolean) to service_role;

revoke all on function
  public.bulk_adjust_product_inventory(uuid[], text, integer) from public;
grant execute on function
  public.bulk_adjust_product_inventory(uuid[], text, integer) to service_role;

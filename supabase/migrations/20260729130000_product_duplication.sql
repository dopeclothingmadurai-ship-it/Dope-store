-- =============================================================================
-- Migration — duplicate_product() transactional function
-- -----------------------------------------------------------------------------
-- Additive only. Duplicates a product and everything under it in a single
-- transaction (atomic — any failure rolls the whole thing back):
--   * product row  (always status='draft', fresh timestamps, new title/slug)
--   * product_media (reuses the same storage URLs)
--   * product_variants (new SKUs supplied by the caller's SKU utility;
--     barcode is cleared because it is globally unique)
--   * inventory settings (threshold/location copied; quantity stays 0 — stock
--     is never copied, it only moves through adjust_inventory())
--   * collection memberships
-- Orders, inventory history and timestamps are intentionally NOT duplicated.
-- =============================================================================

create or replace function public.duplicate_product(
  p_source_id uuid,
  p_title text,
  p_slug text,
  p_variant_skus jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new_id uuid;
  v_variant record;
  v_new_variant_id uuid;
  v_sku text;
begin
  -- Product — copy attributes, force draft, let defaults set fresh timestamps.
  insert into public.products (
    title, slug, description, brand, category_id, status,
    base_price, compare_at_price, featured, tags, seo_title, seo_description
  )
  select
    p_title, p_slug, description, brand, category_id, 'draft',
    base_price, compare_at_price, featured, tags, seo_title, seo_description
  from public.products
  where id = p_source_id
  returning id into v_new_id;

  if v_new_id is null then
    raise exception 'duplicate_product: source product % not found', p_source_id
      using errcode = 'P0002';
  end if;

  -- Media — reuse the same public storage URLs.
  insert into public.product_media (product_id, url, alt, position, is_primary)
  select v_new_id, url, alt, position, is_primary
  from public.product_media
  where product_id = p_source_id;

  -- Variants (+ inventory settings). Each insert auto-provisions an inventory
  -- row at quantity 0 via the existing trigger; we then copy only the settings.
  for v_variant in
    select * from public.product_variants
    where product_id = p_source_id
    order by position, created_at
  loop
    select elem ->> 'sku'
      into v_sku
    from jsonb_array_elements(p_variant_skus) as elem
    where elem ->> 'variant_id' = v_variant.id::text
    limit 1;

    if v_sku is null then
      raise exception 'duplicate_product: missing SKU for variant %', v_variant.id
        using errcode = '22023';
    end if;

    insert into public.product_variants (
      product_id, sku, barcode, size, color, price_override, weight_grams, position
    )
    values (
      v_new_id, v_sku, null, v_variant.size, v_variant.color,
      v_variant.price_override, v_variant.weight_grams, v_variant.position
    )
    returning id into v_new_variant_id;

    update public.inventory dest
    set low_stock_threshold = src.low_stock_threshold,
        location = src.location
    from public.inventory src
    where src.variant_id = v_variant.id
      and dest.variant_id = v_new_variant_id;
  end loop;

  -- Collection memberships.
  insert into public.collection_products (collection_id, product_id, position)
  select collection_id, v_new_id, position
  from public.collection_products
  where product_id = p_source_id;

  return v_new_id;
end;
$$;

-- Only the trusted server (service-role client) may duplicate products.
revoke all on function public.duplicate_product(uuid, text, text, jsonb) from public;
grant execute on function public.duplicate_product(uuid, text, text, jsonb) to service_role;

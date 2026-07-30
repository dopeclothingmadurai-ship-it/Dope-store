-- =============================================================================
-- Phase 5 · Migration — Point of Sale order creation
-- -----------------------------------------------------------------------------
-- Additive only. A single transactional entry point for offline billing so an
-- order, its line items, stock reduction, coupon redemption and timeline are
-- all-or-nothing. Stock is reduced only through adjust_inventory() (the one
-- sanctioned path), so an oversell rolls the whole sale back.
--
-- The caller (POS service) computes and validates every amount first, then
-- hands a fully-priced payload here. POS orders are recorded as paid + handed
-- over (delivered). The customer link is set by the existing BEFORE INSERT
-- trigger from the email.
-- =============================================================================

create or replace function public.create_pos_order(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id     uuid;
  v_order_number text;
  v_item         jsonb;
  v_coupon_id    uuid;
begin
  insert into public.orders (
    channel, status, payment_status, fulfillment_status,
    customer_name, customer_email, customer_phone,
    payment_method, currency,
    subtotal, discount_total, tax_total, shipping_total, grand_total,
    coupon_id, coupon_code, staff_note, placed_at
  )
  values (
    'pos', 'delivered', 'paid', 'delivered',
    nullif(btrim(coalesce(p_payload ->> 'customer_name', '')), ''),
    nullif(btrim(coalesce(p_payload ->> 'customer_email', '')), ''),
    nullif(btrim(coalesce(p_payload ->> 'customer_phone', '')), ''),
    p_payload ->> 'payment_method', 'INR',
    (p_payload ->> 'subtotal')::bigint,
    (p_payload ->> 'discount_total')::bigint,
    (p_payload ->> 'tax_total')::bigint,
    (p_payload ->> 'shipping_total')::bigint,
    (p_payload ->> 'grand_total')::bigint,
    nullif(p_payload ->> 'coupon_id', '')::uuid,
    nullif(p_payload ->> 'coupon_code', ''),
    nullif(p_payload ->> 'note', ''),
    now()
  )
  returning id, order_number into v_order_id, v_order_number;

  for v_item in select * from jsonb_array_elements(p_payload -> 'items')
  loop
    insert into public.order_items (
      order_id, product_id, variant_id, product_title, variant_label, sku,
      unit_price, quantity, subtotal
    )
    values (
      v_order_id,
      nullif(v_item ->> 'product_id', '')::uuid,
      nullif(v_item ->> 'variant_id', '')::uuid,
      v_item ->> 'product_title',
      nullif(v_item ->> 'variant_label', ''),
      nullif(v_item ->> 'sku', ''),
      (v_item ->> 'unit_price')::bigint,
      (v_item ->> 'quantity')::int,
      (v_item ->> 'subtotal')::bigint
    );

    -- Reduce stock through the sanctioned path (rolls back on shortfall).
    if nullif(v_item ->> 'variant_id', '') is not null then
      perform public.adjust_inventory(
        (v_item ->> 'variant_id')::uuid,
        -1 * (v_item ->> 'quantity')::int,
        'sale',
        v_order_number
      );
    end if;
  end loop;

  v_coupon_id := nullif(p_payload ->> 'coupon_id', '')::uuid;
  if v_coupon_id is not null then
    update public.coupons
    set times_used = times_used + 1
    where id = v_coupon_id;

    insert into public.coupon_redemptions
      (coupon_id, order_id, customer_email, discount_amount)
    values (
      v_coupon_id,
      v_order_id,
      nullif(btrim(coalesce(p_payload ->> 'customer_email', '')), ''),
      (p_payload ->> 'discount_total')::bigint
    );
  end if;

  insert into public.order_events (order_id, kind, message)
  values
    (v_order_id, 'created', 'Order created at point of sale'),
    (v_order_id, 'payment',
      'Payment received (' || coalesce(p_payload ->> 'payment_method', 'cash') || ')'),
    (v_order_id, 'fulfillment', 'Handed to customer');

  return v_order_id;
end;
$$;

revoke all on function public.create_pos_order(jsonb) from public;
grant execute on function public.create_pos_order(jsonb) to service_role;

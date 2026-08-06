-- =============================================================================
-- Checkout · Migration — IRL Perks code (store pickup only)
-- -----------------------------------------------------------------------------
-- Additive only. Every store-pickup order gets a unique, permanent IRL Perks
-- code shown at collection to unlock an in-store offer. Home-delivery orders
-- never get one. The code is derived from the order id (md5 → effectively
-- unique) and guarded by a unique index, so it can never repeat and stays
-- linked to the order forever.
-- =============================================================================

alter table public.orders
  add column if not exists irl_perks_code text;
create unique index if not exists orders_irl_perks_code_unique
  on public.orders (irl_perks_code)
  where irl_perks_code is not null;

-- Recreate create_online_order to also stamp the IRL Perks code for pickup.
create or replace function public.create_online_order(p_payload jsonb)
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
  v_rzp_order    text;
  v_fulfillment  text;
begin
  v_rzp_order := nullif(p_payload ->> 'razorpay_order_id', '');

  if v_rzp_order is not null then
    select id into v_order_id
    from public.orders
    where razorpay_order_id = v_rzp_order;
    if v_order_id is not null then
      return v_order_id;
    end if;
  end if;

  v_fulfillment := coalesce(nullif(p_payload ->> 'fulfillment_type', ''), 'delivery');

  insert into public.orders (
    channel, status, payment_status, fulfillment_status,
    fulfillment_type, pickup_status,
    customer_name, customer_email, customer_phone,
    shipping_address,
    payment_method, currency,
    subtotal, discount_total, tax_total, shipping_total, grand_total,
    coupon_id, coupon_code,
    razorpay_order_id, razorpay_payment_id,
    customer_note, placed_at
  )
  values (
    'online', 'pending', 'paid', 'unfulfilled',
    v_fulfillment,
    case when v_fulfillment = 'pickup' then 'pending' else null end,
    nullif(btrim(coalesce(p_payload ->> 'customer_name', '')), ''),
    nullif(btrim(coalesce(p_payload ->> 'customer_email', '')), ''),
    nullif(btrim(coalesce(p_payload ->> 'customer_phone', '')), ''),
    case
      when v_fulfillment = 'delivery' then p_payload -> 'shipping_address'
      else null
    end,
    'razorpay', 'INR',
    (p_payload ->> 'subtotal')::bigint,
    (p_payload ->> 'discount_total')::bigint,
    (p_payload ->> 'tax_total')::bigint,
    (p_payload ->> 'shipping_total')::bigint,
    (p_payload ->> 'grand_total')::bigint,
    nullif(p_payload ->> 'coupon_id', '')::uuid,
    nullif(p_payload ->> 'coupon_code', ''),
    v_rzp_order,
    nullif(p_payload ->> 'razorpay_payment_id', ''),
    nullif(p_payload ->> 'note', ''),
    now()
  )
  returning id, order_number into v_order_id, v_order_number;

  -- IRL Perks: pickup orders only. Deterministic + unique per order.
  if v_fulfillment = 'pickup' then
    update public.orders
    set irl_perks_code = 'IRL-' || upper(substr(md5(v_order_id::text), 1, 8))
    where id = v_order_id;
  end if;

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
    (v_order_id, 'created', 'Order placed online'),
    (v_order_id, 'payment', 'Payment verified via Razorpay');

  return v_order_id;
end;
$$;

revoke all on function public.create_online_order(jsonb) from public;
grant execute on function public.create_online_order(jsonb) to service_role;

-- =============================================================================
-- Checkout · Migration — online orders (Razorpay) + pending checkout snapshot
-- -----------------------------------------------------------------------------
-- Additive only. Online orders share the same orders table / items / inventory
-- / coupon / email flow as POS — only the creation path differs.
--
--   orders.razorpay_order_id / razorpay_payment_id : payment reconciliation.
--     A UNIQUE index on razorpay_order_id makes create_online_order idempotent,
--     so the verify Server Action and the webhook can both call it safely.
--
--   pending_checkouts : the server-priced order snapshot, stored when the
--     Razorpay order is created and consumed when payment is verified. Keeps
--     the order's source of truth on the server (never re-sent by the client),
--     and lets the webhook create the order on its own.
--
--   create_online_order(payload) : transactional order creation after payment
--     verification — order + items + stock reduction (via adjust_inventory) +
--     coupon redemption + timeline, all-or-nothing. Idempotent.
-- =============================================================================

alter table public.orders
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text;
create unique index if not exists orders_razorpay_order_id_unique
  on public.orders (razorpay_order_id)
  where razorpay_order_id is not null;

-- --- pending checkout snapshot ----------------------------------------------
create table if not exists public.pending_checkouts (
  razorpay_order_id text primary key,
  payload           jsonb not null,
  amount            bigint not null,
  created_at        timestamptz not null default now()
);
alter table public.pending_checkouts enable row level security;
-- No policies: only the trusted service-role server (which bypasses RLS) may
-- touch this table.

-- --- create_online_order ----------------------------------------------------
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

  -- Idempotency: if this Razorpay order already produced an order, return it.
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

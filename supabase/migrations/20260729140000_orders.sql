-- =============================================================================
-- Phase 4 · Migration — Order Management
-- -----------------------------------------------------------------------------
-- Additive only. Adds the order domain:
--   orders        one row per order; customer + addresses snapshotted on it
--   order_items   line items, product/variant snapshotted (survive edits)
--   order_events  append-only timeline / audit trail
-- Money is integer paise. Staff-only via the existing is_staff().
-- Orders are created by checkout / POS in later phases; this migration is the
-- storage + management foundation.
-- =============================================================================

-- --- Enums -------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum
      ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum
      ('pending', 'paid', 'partially_refunded', 'refunded', 'failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'fulfillment_status') then
    create type public.fulfillment_status as enum
      ('unfulfilled', 'processing', 'packed', 'shipped', 'delivered', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'order_channel') then
    create type public.order_channel as enum ('online', 'pos');
  end if;
end
$$;

-- --- Human-friendly order numbers: DS-YYYY-00042 -----------------------------
create sequence if not exists public.order_number_seq;

-- --- orders ------------------------------------------------------------------
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text not null unique default (
    'DS-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('public.order_number_seq')::text, 5, '0')
  ),
  channel            public.order_channel not null default 'online',
  status             public.order_status not null default 'pending',
  payment_status     public.payment_status not null default 'pending',
  fulfillment_status public.fulfillment_status not null default 'unfulfilled',
  customer_name      text,
  customer_email     text,
  customer_phone     text,
  shipping_address   jsonb,
  billing_address    jsonb,
  payment_method     text,
  currency           text not null default 'INR',
  subtotal           bigint not null default 0,
  discount_total     bigint not null default 0,
  tax_total          bigint not null default 0,
  shipping_total     bigint not null default 0,
  grand_total        bigint not null default 0,
  customer_note      text,
  staff_note         text,
  placed_at          timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint orders_subtotal_nonneg check (subtotal >= 0),
  constraint orders_discount_nonneg check (discount_total >= 0),
  constraint orders_tax_nonneg check (tax_total >= 0),
  constraint orders_shipping_nonneg check (shipping_total >= 0),
  constraint orders_grand_total_nonneg check (grand_total >= 0)
);
create index if not exists orders_placed_at_idx on public.orders (placed_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_payment_status_idx on public.orders (payment_status);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- --- order_items -------------------------------------------------------------
create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  product_id     uuid references public.products (id) on delete set null,
  variant_id     uuid references public.product_variants (id) on delete set null,
  product_title  text not null,
  variant_label  text,
  sku            text,
  unit_price     bigint not null,
  quantity       integer not null,
  subtotal       bigint not null,
  created_at     timestamptz not null default now(),
  constraint order_items_unit_price_nonneg check (unit_price >= 0),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_subtotal_nonneg check (subtotal >= 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- --- order_events (timeline / audit trail) -----------------------------------
create table if not exists public.order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  kind       text not null,
  message    text not null,
  created_at timestamptz not null default now(),
  constraint order_events_kind_not_blank check (length(btrim(kind)) > 0),
  constraint order_events_message_not_blank check (length(btrim(message)) > 0)
);
create index if not exists order_events_order_idx
  on public.order_events (order_id, created_at desc);

-- --- RLS: staff only (no public access to orders) ----------------------------
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

drop policy if exists orders_all_staff on public.orders;
create policy orders_all_staff on public.orders for all
  to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists order_items_all_staff on public.order_items;
create policy order_items_all_staff on public.order_items for all
  to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists order_events_all_staff on public.order_events;
create policy order_events_all_staff on public.order_events for all
  to authenticated using (public.is_staff()) with check (public.is_staff());

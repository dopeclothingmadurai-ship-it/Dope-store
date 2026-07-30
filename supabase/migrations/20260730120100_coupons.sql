-- =============================================================================
-- Phase 5 · Migration — Coupons
-- -----------------------------------------------------------------------------
-- Additive only. Discount codes with the same archive/restore lifecycle used
-- across the catalog (never hard-deleted).
--
--   coupons              percentage or fixed-amount discounts with limits +
--                        an optional active window; code is unique case-insensitively
--   coupon_redemptions   one row per successful application (usage + per-customer
--                        limits, reporting)
--   orders.coupon_id     link + code snapshot for order display
--
-- Money is integer paise. A percentage coupon stores `value` as a whole percent
-- (1..100); a fixed coupon stores `value` as paise.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'coupon_type') then
    create type public.coupon_type as enum ('percentage', 'fixed');
  end if;
end
$$;

create table if not exists public.coupons (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null,
  description        text,
  type               public.coupon_type not null,
  value              bigint not null,              -- percent (1..100) or paise
  min_order          bigint not null default 0,    -- paise
  max_discount       bigint,                        -- paise cap (percentage), nullable
  usage_limit        integer,                       -- null = unlimited
  per_customer_limit integer,                       -- null = unlimited
  times_used         integer not null default 0,
  starts_at          timestamptz,
  ends_at            timestamptz,
  archived_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint coupons_code_not_blank check (length(btrim(code)) > 0),
  constraint coupons_value_positive check (value > 0),
  constraint coupons_percentage_range
    check (type <> 'percentage' or value <= 100),
  constraint coupons_min_order_nonneg check (min_order >= 0),
  constraint coupons_max_discount_nonneg
    check (max_discount is null or max_discount >= 0),
  constraint coupons_usage_limit_positive
    check (usage_limit is null or usage_limit > 0),
  constraint coupons_per_customer_positive
    check (per_customer_limit is null or per_customer_limit > 0),
  constraint coupons_times_used_nonneg check (times_used >= 0),
  constraint coupons_window_valid
    check (starts_at is null or ends_at is null or ends_at >= starts_at)
);
-- Case-insensitive uniqueness: SAVE10 and save10 are the same code.
create unique index if not exists coupons_code_unique
  on public.coupons (upper(code));
create index if not exists coupons_active_idx
  on public.coupons (archived_at) where archived_at is null;

drop trigger if exists coupons_set_updated_at on public.coupons;
create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

-- --- coupon_redemptions ------------------------------------------------------
create table if not exists public.coupon_redemptions (
  id              uuid primary key default gen_random_uuid(),
  coupon_id       uuid not null references public.coupons (id) on delete cascade,
  order_id        uuid references public.orders (id) on delete set null,
  customer_email  text,
  discount_amount bigint not null default 0,
  created_at      timestamptz not null default now(),
  constraint coupon_redemptions_discount_nonneg check (discount_amount >= 0)
);
create index if not exists coupon_redemptions_coupon_idx
  on public.coupon_redemptions (coupon_id);
create index if not exists coupon_redemptions_email_idx
  on public.coupon_redemptions (lower(customer_email));

-- --- orders.coupon link + snapshot -------------------------------------------
alter table public.orders
  add column if not exists coupon_id uuid references public.coupons (id) on delete set null,
  add column if not exists coupon_code text;

-- --- RLS: staff only ---------------------------------------------------------
alter table public.coupons enable row level security;
drop policy if exists coupons_all_staff on public.coupons;
create policy coupons_all_staff
  on public.coupons for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

alter table public.coupon_redemptions enable row level security;
drop policy if exists coupon_redemptions_all_staff on public.coupon_redemptions;
create policy coupon_redemptions_all_staff
  on public.coupon_redemptions for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

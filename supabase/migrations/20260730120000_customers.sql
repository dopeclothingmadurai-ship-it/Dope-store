-- =============================================================================
-- Phase 5 · Migration — Customers
-- -----------------------------------------------------------------------------
-- Additive only. Introduces a customer directory that is populated
-- automatically from placed orders (online or POS). Customers are keyed by a
-- normalized (lower-cased) email so a repeat buyer is never duplicated.
--
--   customers          one row per unique email; staff-editable note
--   orders.customer_id backfilled + kept in sync by a BEFORE INSERT trigger
--
-- Aggregate figures (total orders, spend, AOV, first/last order) are derived
-- at read time from orders — never denormalized here.
-- =============================================================================

-- --- customers ---------------------------------------------------------------
create table if not exists public.customers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  name       text,
  phone      text,
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_email_not_blank check (length(btrim(email)) > 0)
);
-- One customer per email (stored already normalized/lower-cased).
create unique index if not exists customers_email_unique on public.customers (email);

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- --- orders.customer_id ------------------------------------------------------
alter table public.orders
  add column if not exists customer_id uuid references public.customers (id) on delete set null;
create index if not exists orders_customer_idx on public.orders (customer_id);

-- --- Auto-link an order to its customer (create on first sight) ---------------
create or replace function public.link_order_customer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_id    uuid;
begin
  if new.customer_email is null or length(btrim(new.customer_email)) = 0 then
    return new;
  end if;

  v_email := lower(btrim(new.customer_email));

  insert into public.customers (email, name, phone)
  values (
    v_email,
    nullif(btrim(coalesce(new.customer_name, '')), ''),
    nullif(btrim(coalesce(new.customer_phone, '')), '')
  )
  on conflict (email) do update
    set name  = coalesce(public.customers.name, excluded.name),
        phone = coalesce(public.customers.phone, excluded.phone),
        updated_at = now()
  returning id into v_id;

  new.customer_id := v_id;
  return new;
end;
$$;

drop trigger if exists link_order_customer on public.orders;
create trigger link_order_customer
  before insert on public.orders
  for each row execute function public.link_order_customer();

-- --- Backfill from existing orders -------------------------------------------
insert into public.customers (email, name, phone)
select
  lower(btrim(o.customer_email)),
  nullif(btrim(max(o.customer_name)), ''),
  nullif(btrim(max(o.customer_phone)), '')
from public.orders o
where o.customer_email is not null
  and length(btrim(o.customer_email)) > 0
group by lower(btrim(o.customer_email))
on conflict (email) do nothing;

update public.orders o
set customer_id = c.id
from public.customers c
where c.email = lower(btrim(o.customer_email))
  and o.customer_id is null;

-- --- RLS: staff only ---------------------------------------------------------
alter table public.customers enable row level security;

drop policy if exists customers_all_staff on public.customers;
create policy customers_all_staff
  on public.customers for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

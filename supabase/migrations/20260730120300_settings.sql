-- =============================================================================
-- Phase 5 · Migration — Store settings + staff role expansion
-- -----------------------------------------------------------------------------
-- Additive only.
--   store_settings   a single-row store configuration (name, contact, tax,
--                    shipping, currency, timezone, maintenance mode, public
--                    Razorpay key id). NO secrets are stored here — the
--                    Razorpay secret and service-role key stay in server env.
--   staff_profiles   role check widened to include 'editor' (owner/manager/
--                    editor/staff) for the Admin Users section.
-- =============================================================================

-- --- store_settings (singleton) ----------------------------------------------
create table if not exists public.store_settings (
  id                      boolean primary key default true,
  store_name              text not null default 'Dope Store',
  support_email           text,
  support_phone           text,
  gst_number              text,
  address                 jsonb,
  currency                text not null default 'INR',
  timezone                text not null default 'Asia/Kolkata',
  tax_rate_bps            integer not null default 0,   -- basis points (500 = 5%)
  shipping_flat           bigint not null default 0,    -- paise
  free_shipping_threshold bigint,                        -- paise, nullable
  razorpay_key_id         text,                          -- PUBLIC key id only
  logo_url                text,
  maintenance_mode        boolean not null default false,
  updated_at              timestamptz not null default now(),
  constraint store_settings_singleton check (id = true),
  constraint store_settings_tax_nonneg check (tax_rate_bps >= 0),
  constraint store_settings_tax_max check (tax_rate_bps <= 10000),
  constraint store_settings_shipping_nonneg check (shipping_flat >= 0),
  constraint store_settings_free_ship_nonneg
    check (free_shipping_threshold is null or free_shipping_threshold >= 0)
);

insert into public.store_settings (id) values (true)
on conflict (id) do nothing;

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

alter table public.store_settings enable row level security;
drop policy if exists store_settings_all_staff on public.store_settings;
create policy store_settings_all_staff
  on public.store_settings for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- --- staff_profiles: allow the 'editor' role ---------------------------------
-- The original role check was an inline (auto-named) column constraint. Drop
-- whichever check constraint currently governs `role`, then add the widened one.
do $$
declare
  v_name text;
begin
  select con.conname into v_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'staff_profiles'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%role%'
  limit 1;

  if v_name is not null then
    execute format('alter table public.staff_profiles drop constraint %I', v_name);
  end if;
end
$$;

alter table public.staff_profiles
  add constraint staff_profiles_role_check
  check (role in ('owner', 'manager', 'editor', 'staff'));

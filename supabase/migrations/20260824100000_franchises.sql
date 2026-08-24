-- =============================================================================
-- Admin · Migration — Franchise records
-- -----------------------------------------------------------------------------
-- A simple, staff-managed directory of Dope Store franchise/branch locations.
-- Intentionally minimal — name, location, contact, status, notes. No franchise
-- accounting, inventory, employees, or permissions. Admin-only (managed through
-- the existing staff auth); the service-role server bypasses RLS as elsewhere.
-- =============================================================================

create table if not exists public.franchises (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text,
  location    text,
  phone       text,
  email       text,
  address     text,
  status      text not null default 'active',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint franchises_name_not_blank check (length(btrim(name)) > 0),
  constraint franchises_status_valid check (status in ('active', 'inactive'))
);

create index if not exists franchises_status_idx
  on public.franchises (status, created_at desc);

drop trigger if exists franchises_set_updated_at on public.franchises;
create trigger franchises_set_updated_at
  before update on public.franchises
  for each row execute function public.set_updated_at();

-- --- RLS ---------------------------------------------------------------------
alter table public.franchises enable row level security;

-- Staff manage everything (service-role server also bypasses RLS). No public
-- policy — franchise records are an internal admin directory.
drop policy if exists franchises_all_staff on public.franchises;
create policy franchises_all_staff
  on public.franchises for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

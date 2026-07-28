-- =============================================================================
-- Phase 3 · Migration — staff authentication
-- -----------------------------------------------------------------------------
-- Additive only. Completes the staff system that Phase 1's is_staff() was
-- designed for:
--   * staff_profiles maps an auth user to a staff role.
--   * is_staff() now also recognizes an authenticated user who has a
--     staff_profiles row, in addition to the trusted server (service_role).
-- No existing RLS policy changes — they already call is_staff().
-- =============================================================================

create table if not exists public.staff_profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'staff'
             check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now()
);

alter table public.staff_profiles enable row level security;

-- A signed-in user may read their own staff row. Writes are performed by the
-- trusted server (service-role client) only — no anon/authenticated write
-- policy exists, so those roles are denied.
drop policy if exists staff_profiles_select_self on public.staff_profiles;
create policy staff_profiles_select_self
  on public.staff_profiles for select
  to authenticated
  using (id = (select auth.uid()));

-- Upgrade is_staff(): trusted server OR an authenticated user with a staff row.
-- SECURITY DEFINER means the inner read of staff_profiles is not itself subject
-- to RLS, so there is no policy recursion.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(auth.jwt() ->> 'role', '') = 'service_role'
    or exists (
      select 1
      from public.staff_profiles sp
      where sp.id = (select auth.uid())
    );
$$;

grant execute on function public.is_staff() to anon, authenticated;

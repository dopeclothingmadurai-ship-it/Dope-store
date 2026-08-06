-- =============================================================================
-- Storefront · Migration — Contact messages
-- -----------------------------------------------------------------------------
-- Additive only. Backs the contact form so submissions genuinely persist.
-- Anyone may submit; only staff can read them.
-- =============================================================================

create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text,
  message    text not null,
  created_at timestamptz not null default now(),
  constraint contact_name_not_blank check (length(btrim(name)) > 0),
  constraint contact_email_not_blank check (length(btrim(email)) > 0),
  constraint contact_message_not_blank check (length(btrim(message)) > 0)
);

alter table public.contact_messages enable row level security;

drop policy if exists contact_insert_public on public.contact_messages;
create policy contact_insert_public
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

drop policy if exists contact_select_staff on public.contact_messages;
create policy contact_select_staff
  on public.contact_messages for select
  to authenticated
  using (public.is_staff());

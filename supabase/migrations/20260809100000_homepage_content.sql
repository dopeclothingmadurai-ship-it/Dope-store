-- =============================================================================
-- Storefront · Migration — Homepage content (CMS)
-- -----------------------------------------------------------------------------
-- Additive only. A single-row, staff-managed content record that drives the
-- homepage Hero, the promotional banner beside it, and the top announcement
-- marquee. Same singleton pattern as `store_settings` (a boolean primary key
-- pinned to `true`). Publicly readable — this is all display copy/imagery, no
-- secrets — and staff-writable. The storefront falls back to sensible defaults
-- if the row is ever missing, so it can never crash a page.
-- =============================================================================

create table if not exists public.homepage_content (
  id boolean primary key default true,

  -- --- Hero ------------------------------------------------------------------
  -- Typography is owned by the frontend (fixed editorial hero font); the admin
  -- only edits content: image, tagline and CTA.
  hero_enabled     boolean not null default true,
  hero_image_url   text,
  hero_tagline     text not null default 'A NEW CULTURE IS HERE',
  hero_cta_label   text not null default 'Wear the Culture',
  hero_cta_href    text not null default '/shop',

  -- --- Promotional banner (beside the hero) ----------------------------------
  banner_enabled            boolean not null default false,
  banner_text               text not null default 'PRIVATE DROP',
  banner_offer_text         text not null default 'Members unlock early access',
  banner_countdown_enabled  boolean not null default false,
  banner_countdown_ends_at  timestamptz,
  banner_speed              integer not null default 26,
  banner_direction          text not null default 'left',

  -- --- Top announcement marquee ----------------------------------------------
  announcement_enabled    boolean not null default true,
  announcement_messages   jsonb not null default
    '["Complimentary shipping over ₹2,000","Autumn — Winter 26","Crafted to last","Made in India"]'::jsonb,
  announcement_speed      integer not null default 24,
  announcement_direction  text not null default 'left',

  updated_at timestamptz not null default now(),

  constraint homepage_content_singleton check (id),
  constraint homepage_content_banner_direction check (banner_direction in ('left', 'right')),
  constraint homepage_content_announcement_direction check (announcement_direction in ('left', 'right')),
  constraint homepage_content_banner_speed check (banner_speed between 4 and 120),
  constraint homepage_content_announcement_speed check (announcement_speed between 4 and 120)
);

-- Seed the single row (defaults mirror the current hardcoded storefront copy so
-- nothing changes visually until an admin edits it).
insert into public.homepage_content (id) values (true)
on conflict (id) do nothing;

drop trigger if exists homepage_content_set_updated_at on public.homepage_content;
create trigger homepage_content_set_updated_at
  before update on public.homepage_content
  for each row execute function public.set_updated_at();

-- --- RLS ---------------------------------------------------------------------
alter table public.homepage_content enable row level security;

-- Anyone may read the homepage content (storefront display copy/imagery).
drop policy if exists homepage_content_select_public on public.homepage_content;
create policy homepage_content_select_public
  on public.homepage_content for select
  to anon, authenticated
  using (true);

-- Staff manage it (the service-role server also bypasses RLS).
drop policy if exists homepage_content_all_staff on public.homepage_content;
create policy homepage_content_all_staff
  on public.homepage_content for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

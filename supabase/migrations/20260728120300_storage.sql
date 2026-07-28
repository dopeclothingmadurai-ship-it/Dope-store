-- =============================================================================
-- Phase 1 · Migration 4 — Storage buckets
-- -----------------------------------------------------------------------------
-- Public-read buckets for catalog and homepage imagery. Uploads/edits/deletes
-- are staff-only. No review-media bucket (photo reviews are out of scope).
-- =============================================================================

insert into storage.buckets (id, name, public)
values
  ('product-media',  'product-media',  true),
  ('homepage-media', 'homepage-media', true)
on conflict (id) do nothing;

-- --- product-media -----------------------------------------------------------
drop policy if exists product_media_public_read on storage.objects;
create policy product_media_public_read
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-media');

drop policy if exists product_media_staff_write on storage.objects;
create policy product_media_staff_write
  on storage.objects for all
  to authenticated
  using (bucket_id = 'product-media' and public.is_staff())
  with check (bucket_id = 'product-media' and public.is_staff());

-- --- homepage-media ----------------------------------------------------------
drop policy if exists homepage_media_public_read on storage.objects;
create policy homepage_media_public_read
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'homepage-media');

drop policy if exists homepage_media_staff_write on storage.objects;
create policy homepage_media_staff_write
  on storage.objects for all
  to authenticated
  using (bucket_id = 'homepage-media' and public.is_staff())
  with check (bucket_id = 'homepage-media' and public.is_staff());

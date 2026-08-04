-- =============================================================================
-- Storefront · Migration — customer review integrity + review image storage
-- -----------------------------------------------------------------------------
-- Additive only. Builds on 20260804100000_storefront_reviews_curated.sql.
--   * One review per customer per product (partial unique index).
--   * A public-read `review-media` bucket for customer-uploaded review photos.
--     Writes are performed by the trusted server (service-role client) after a
--     customer is authenticated and their purchase verified, so no anon/auth
--     write policy is granted — only public read.
-- Review submission itself is gated in application code (auth + purchase check)
-- and written with the service-role client, so no customer RLS write policy is
-- added to public.reviews.
-- =============================================================================

-- --- One review per customer per product -------------------------------------
create unique index if not exists reviews_customer_product_unique
  on public.reviews (customer_id, product_id)
  where customer_id is not null;

-- --- review-media bucket ------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('review-media', 'review-media', true)
on conflict (id) do nothing;

drop policy if exists review_media_public_read on storage.objects;
create policy review_media_public_read
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'review-media');

drop policy if exists review_media_staff_write on storage.objects;
create policy review_media_staff_write
  on storage.objects for all
  to authenticated
  using (bucket_id = 'review-media' and public.is_staff())
  with check (bucket_id = 'review-media' and public.is_staff());

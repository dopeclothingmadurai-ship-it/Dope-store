-- =============================================================================
-- Storefront · Migration — Hero supports multiple images
-- -----------------------------------------------------------------------------
-- Additive. The hero moves from a single `hero_image_url` to an ordered list of
-- images (`hero_images`, a jsonb array of public URLs). The existing single
-- image is preserved by migrating it into the array as the first entry. The old
-- column is kept (written as the first image) for backward compatibility.
-- =============================================================================

alter table public.homepage_content
  add column if not exists hero_images jsonb not null default '[]'::jsonb;

-- Seed the array from the existing single image, if present and not already set.
update public.homepage_content
set hero_images = jsonb_build_array(hero_image_url)
where (hero_images is null or hero_images = '[]'::jsonb)
  and hero_image_url is not null
  and length(btrim(hero_image_url)) > 0;

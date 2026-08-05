-- =============================================================================
-- Stabilization · Migration — index order_items by product
-- -----------------------------------------------------------------------------
-- Additive only. The storefront review purchase-check filters order_items by
-- product_id ("has this customer bought this product?"). The table previously
-- had an index on order_id only, so that lookup scanned. This adds the missing
-- product_id index.
-- =============================================================================

create index if not exists order_items_product_idx
  on public.order_items (product_id);

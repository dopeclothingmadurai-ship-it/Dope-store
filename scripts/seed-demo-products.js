/**
 * Seed six premium DEMO products (copyright-free Unsplash imagery) so the
 * storefront looks populated. Idempotent — tagged `demo`, safe to re-run, and
 * removable from the admin (Products → filter/delete). Run from the repo root:
 *
 *   node scripts/seed-demo-products.js
 *
 * Not part of the app runtime; delete these products once real catalog exists.
 */
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Copyright-free Unsplash CDN images (portrait crop for product cards).
const img = (id) =>
  `https://images.unsplash.com/photo-${id}?w=800&h=1000&fit=crop&crop=entropy&q=80&fm=jpg`;

const PRODUCTS = [
  {
    slug: "luxury-oversized-tee",
    title: "Luxury Oversized Tee",
    category: "Oversized T-Shirts",
    price: 149900,
    compareAt: 219900,
    photo: "1521572163474-6864f9cf17ab",
    sizes: ["S", "M", "L", "XL"],
    featured: true,
    curated: true,
    description:
      "A heavyweight oversized tee in premium combed cotton. Boxy drape, clean neckline, made to layer.",
  },
  {
    slug: "premium-hoodie",
    title: "Premium Hoodie",
    category: "Hoodies",
    price: 349900,
    compareAt: null,
    photo: "1556821840-3a63f95609a7",
    sizes: ["S", "M", "L", "XL"],
    featured: true,
    curated: false,
    description:
      "Brushed-back fleece hoodie with a structured hood and refined ribbing. Weighted, warm, everyday luxury.",
  },
  {
    slug: "classic-denim",
    title: "Classic Denim",
    category: "Jeans",
    price: 299900,
    compareAt: 399900,
    photo: "1542272604-787c3835535d",
    sizes: ["30", "32", "34", "36"],
    featured: false,
    curated: true,
    description:
      "Rigid selvedge-inspired denim with a straight leg and a timeless mid-wash. Built to age beautifully.",
  },
  {
    slug: "luxury-shirt",
    title: "Luxury Shirt",
    category: "Shirts",
    price: 199900,
    compareAt: null,
    photo: "1620799140408-edc6dcb6d633",
    sizes: ["S", "M", "L", "XL"],
    featured: false,
    curated: false,
    description:
      "A crisp poplin shirt with mother-of-pearl buttons and a considered collar. Tailored, versatile, sharp.",
  },
  {
    slug: "varsity-jacket",
    title: "Varsity Jacket",
    category: "Jackets",
    price: 599900,
    compareAt: 749900,
    photo: "1551028719-00167b16eac5",
    sizes: ["S", "M", "L", "XL"],
    featured: true,
    curated: true,
    description:
      "A modern varsity jacket with a wool-blend body, leather-look sleeves and ribbed trims. Statement outerwear.",
  },
  {
    slug: "traditional-collection",
    title: "Traditional Collection",
    category: "Traditional Wears",
    price: 449900,
    compareAt: null,
    photo: "1489987707025-afc232f7ea0f",
    sizes: ["S", "M", "L", "XL"],
    featured: false,
    curated: false,
    description:
      "An elevated take on traditional dress — fluid drape, hand-finished detail, crafted for occasion.",
  },
];

async function main() {
  // Category slug → id.
  const { data: cats, error: catErr } = await db
    .from("categories")
    .select("id, name");
  if (catErr) throw catErr;
  const catByName = Object.fromEntries(cats.map((c) => [c.name, c.id]));

  // Idempotent: remove any prior demo products (cascades to variants/media).
  const { data: existing } = await db
    .from("products")
    .select("id")
    .contains("tags", ["demo"]);
  if (existing && existing.length) {
    await db
      .from("products")
      .delete()
      .in(
        "id",
        existing.map((p) => p.id),
      );
    console.log("Removed", existing.length, "existing demo products");
  }

  for (const p of PRODUCTS) {
    const { data: product, error: pErr } = await db
      .from("products")
      .insert({
        slug: p.slug,
        title: p.title,
        description: p.description,
        brand: "DOPE",
        base_price: p.price,
        compare_at_price: p.compareAt,
        status: "active",
        category_id: catByName[p.category] ?? null,
        featured: p.featured,
        show_in_curated_fits: p.curated,
        tags: ["demo"],
      })
      .select("id")
      .single();
    if (pErr) throw pErr;

    // Variants + inventory.
    const variantRows = p.sizes.map((size, i) => ({
      product_id: product.id,
      size,
      sku: `DOPE-${p.slug.toUpperCase().replace(/-/g, "")}-${size}`,
      position: i,
    }));
    const { data: variants, error: vErr } = await db
      .from("product_variants")
      .insert(variantRows)
      .select("id");
    if (vErr) throw vErr;

    // Each variant auto-gets an inventory row at 0; add stock via the
    // canonical adjust_inventory() path.
    for (const v of variants) {
      const { error: aErr } = await db.rpc("adjust_inventory", {
        p_variant_id: v.id,
        p_delta: 25,
        p_reason: "restock",
      });
      if (aErr) throw aErr;
    }

    // Primary image.
    const { error: mErr } = await db.from("product_media").insert({
      product_id: product.id,
      url: img(p.photo),
      is_primary: true,
      position: 0,
      alt: p.title,
    });
    if (mErr) throw mErr;

    console.log("Seeded:", p.title, `(${p.sizes.length} variants)`);
  }

  console.log("\nDone —", PRODUCTS.length, "demo products.");
}

main().catch((e) => {
  console.error("SEED ERROR:", e.message);
  process.exit(1);
});

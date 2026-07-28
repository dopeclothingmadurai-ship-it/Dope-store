import { type Enums, type Tables } from "@/types/database";

export type Product = Tables<"products">;
export type ProductVariant = Tables<"product_variants">;
export type ProductMedia = Tables<"product_media">;
export type Inventory = Tables<"inventory">;

export type VariantWithInventory = ProductVariant & {
  inventory: Inventory | null;
};

export type ProductListItem = Product & {
  primaryImageUrl: string | null;
  categoryName: string | null;
};

export type ProductDetail = Product & {
  media: ProductMedia[];
  variants: VariantWithInventory[];
  collectionIds: string[];
};

export type ProductListResult = {
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
};

/** Minimal product option used by the collection assignment picker. */
export type AssignableProduct = {
  id: string;
  title: string;
  status: Enums<"product_status">;
};

export type { ProductFormValues, VariantFormValues } from "./schema";

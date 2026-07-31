import { type Enums, type Tables } from "@/types/database";

export type Product = Tables<"products">;
export type ProductVariant = Tables<"product_variants">;
export type ProductMedia = Tables<"product_media">;
export type Inventory = Tables<"inventory">;
export type InventoryMovement = Tables<"inventory_movements">;

/** An inventory movement joined with its variant SKU, for the history view. */
export type InventoryMovementItem = InventoryMovement & { sku: string };

export type ProductSort = "title" | "price" | "status" | "created";
export type ProductStatus = Enums<"product_status">;

export type VariantWithInventory = ProductVariant & {
  inventory: Inventory | null;
};

export type ProductListItem = Product & {
  primaryImageUrl: string | null;
  categoryName: string | null;
  sku: string | null;
  variantCount: number;
  available: number;
  reserved: number;
  lowStock: boolean;
  outOfStock: boolean;
  collectionNames: string[];
};

/** Active list filters, echoed back so the toolbar can reflect them. */
export type ProductFilters = {
  status: ProductStatus | null;
  categoryId: string | null;
  collectionId: string | null;
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
  sort: ProductSort;
  dir: "asc" | "desc";
  filters: ProductFilters;
};

/** Minimal product option used by the collection assignment picker. */
export type AssignableProduct = {
  id: string;
  title: string;
  status: Enums<"product_status">;
};

/** Price + stock snapshot for a selected product, used by bulk-edit previews. */
export type BulkProductSummary = {
  id: string;
  title: string;
  basePrice: number;
  stock: number;
  variantCount: number;
};

export type { ProductFormValues, VariantFormValues } from "./schema";

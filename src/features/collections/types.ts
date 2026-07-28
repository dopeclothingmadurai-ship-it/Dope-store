import { type Enums, type Tables } from "@/types/database";

export type Collection = Tables<"collections">;

export type CollectionListItem = Collection & { productCount: number };

export type AssignedProduct = {
  id: string;
  title: string;
  slug: string;
  status: Enums<"product_status">;
  position: number;
};

export type { CollectionFormValues } from "./schema";

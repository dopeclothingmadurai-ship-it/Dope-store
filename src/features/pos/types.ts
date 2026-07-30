export type PosSearchItem = {
  variantId: string;
  productId: string;
  productTitle: string;
  variantLabel: string | null;
  sku: string;
  unitPrice: number; // paise
  available: number;
};

export type PosCustomer = {
  id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
};

export type { PosOrderValues } from "./schema";

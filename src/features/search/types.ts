export type SearchKind = "product" | "order" | "customer" | "coupon";

export type SearchResultItem = {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string | null;
  href: string;
};

export type SearchResults = {
  products: SearchResultItem[];
  orders: SearchResultItem[];
  customers: SearchResultItem[];
  coupons: SearchResultItem[];
};

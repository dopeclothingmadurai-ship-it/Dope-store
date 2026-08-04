export type StoreProductCard = {
  id: string;
  slug: string;
  title: string;
  price: number; // paise
  compareAtPrice: number | null;
  imageUrl: string | null;
  hoverImageUrl: string | null;
};

export type StoreVariant = {
  id: string;
  size: string | null;
  color: string | null;
  sku: string;
  price: number; // paise (override or base)
};

export type StoreReview = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  imageUrls: string[];
  createdAt: string;
};

export type StoreProductDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  brand: string | null;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  variants: StoreVariant[];
  sizes: string[];
  colors: string[];
};

import { notFound } from "next/navigation";

import { listCategoryOptions } from "@/features/categories/queries";
import { listCollectionOptions } from "@/features/collections/queries";
import { ProductEditor } from "@/features/products/components/product-editor";
import { getProductDetail } from "@/features/products/queries";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, collections] = await Promise.all([
    getProductDetail(id),
    listCategoryOptions(),
    listCollectionOptions(),
  ]);

  if (!product) notFound();

  return (
    <ProductEditor
      product={product}
      categories={categories}
      collections={collections}
    />
  );
}

import { ArrowLeft } from "lucide-react";

import { LinkButton } from "@/components/admin/link-button";
import { PageHeader } from "@/components/admin/page-header";
import { listCategoryOptions } from "@/features/categories/queries";
import { listCollectionOptions } from "@/features/collections/queries";
import { ProductForm } from "@/features/products/components/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, collections] = await Promise.all([
    listCategoryOptions(),
    listCollectionOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <LinkButton
          variant="ghost"
          size="sm"
          className="-ml-2"
          href="/admin/catalog/products"
        >
          <ArrowLeft /> Products
        </LinkButton>
        <PageHeader
          title="New product"
          description="Create the product, then add images, variants and stock."
        />
      </div>
      <ProductForm
        product={null}
        categories={categories}
        collections={collections}
      />
    </div>
  );
}

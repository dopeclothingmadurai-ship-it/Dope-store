import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
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
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          render={<Link href="/admin/catalog/products" />}
        >
          <ArrowLeft /> Products
        </Button>
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CollectionProductsEditor } from "@/features/collections/components/collection-products-editor";
import {
  getCollection,
  listCollectionProducts,
} from "@/features/collections/queries";
import { listAssignableProducts } from "@/features/products/queries";

export const dynamic = "force-dynamic";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = await getCollection(id);
  if (!collection) notFound();

  const [assigned, available] = await Promise.all([
    listCollectionProducts(id),
    listAssignableProducts(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          render={<Link href="/admin/catalog/collections" />}
        >
          <ArrowLeft /> Collections
        </Button>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          {collection.name}
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage the products in this collection and their order.
        </p>
      </div>

      <CollectionProductsEditor
        collectionId={id}
        assigned={assigned.map((product) => ({
          id: product.id,
          title: product.title,
          status: product.status,
        }))}
        available={available}
      />
    </div>
  );
}

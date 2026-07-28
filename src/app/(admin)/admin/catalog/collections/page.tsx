import { CollectionsManager } from "@/features/collections/components/collections-manager";
import { listCollections } from "@/features/collections/queries";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const collections = await listCollections();
  return <CollectionsManager collections={collections} />;
}

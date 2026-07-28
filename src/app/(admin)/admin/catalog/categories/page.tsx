import { CategoriesManager } from "@/features/categories/components/categories-manager";
import { listCategories } from "@/features/categories/queries";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await listCategories();
  return <CategoriesManager categories={categories} />;
}

import { listCategoryOptions } from "@/features/categories/queries";
import { listCollectionOptions } from "@/features/collections/queries";
import { ProductsManager } from "@/features/products/components/products-manager";
import { listProducts } from "@/features/products/queries";
import {
  type ProductSort,
  type ProductStatus,
} from "@/features/products/types";

export const dynamic = "force-dynamic";

const SORTS: ProductSort[] = ["title", "price", "status", "created"];
const STATUSES: ProductStatus[] = ["draft", "active", "archived"];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sort?: string;
    dir?: string;
    status?: string;
    category?: string;
    collection?: string;
  }>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const parsedPage = Number(params.page);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const sort: ProductSort = SORTS.includes(params.sort as ProductSort)
    ? (params.sort as ProductSort)
    : "created";
  const dir: "asc" | "desc" = params.dir === "asc" ? "asc" : "desc";
  const status: ProductStatus | null = STATUSES.includes(
    params.status as ProductStatus,
  )
    ? (params.status as ProductStatus)
    : null;
  const categoryId = params.category?.trim() || null;
  const collectionId = params.collection?.trim() || null;

  const [result, categories, collections] = await Promise.all([
    listProducts({ page, search, sort, dir, status, categoryId, collectionId }),
    listCategoryOptions(),
    listCollectionOptions(),
  ]);

  return (
    <ProductsManager
      result={result}
      search={search}
      categories={categories}
      collections={collections}
    />
  );
}

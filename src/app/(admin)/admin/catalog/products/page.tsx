import { ProductsManager } from "@/features/products/components/products-manager";
import { listProducts } from "@/features/products/queries";
import { type ProductSort } from "@/features/products/types";

export const dynamic = "force-dynamic";

const SORTS: ProductSort[] = ["title", "price", "status", "created"];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sort?: string;
    dir?: string;
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

  const result = await listProducts({ page, search, sort, dir });
  return <ProductsManager result={result} search={search} />;
}

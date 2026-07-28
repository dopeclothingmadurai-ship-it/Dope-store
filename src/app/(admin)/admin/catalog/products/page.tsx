import { ProductsManager } from "@/features/products/components/products-manager";
import { listProducts } from "@/features/products/queries";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const parsedPage = Number(params.page);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const result = await listProducts({ page, search });
  return <ProductsManager result={result} search={search} />;
}

import { CustomersManager } from "@/features/customers/components/customers-manager";
import { listCustomers } from "@/features/customers/queries";
import { type CustomerSort } from "@/features/customers/types";

export const dynamic = "force-dynamic";

const SORTS: CustomerSort[] = ["created", "name"];

export default async function CustomersPage({
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
  const sort: CustomerSort = SORTS.includes(params.sort as CustomerSort)
    ? (params.sort as CustomerSort)
    : "created";
  const dir: "asc" | "desc" = params.dir === "asc" ? "asc" : "desc";

  const result = await listCustomers({ page, search, sort, dir });

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-white">
          Customers
        </h1>
        <p className="text-muted-foreground text-sm">
          Everyone who has placed an order, with lifetime value at a glance.
        </p>
      </div>

      <CustomersManager result={result} search={search} />
    </div>
  );
}

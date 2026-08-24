import { FranchisesManager } from "@/features/franchises";
import { listFranchises } from "@/features/franchises/queries";

export const dynamic = "force-dynamic";

export default async function AdminFranchisePage() {
  const franchises = await listFranchises();
  return <FranchisesManager franchises={franchises} />;
}

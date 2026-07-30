import { PosTerminal } from "@/features/pos/components/pos-terminal";

export const dynamic = "force-dynamic";

export default function PosPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-white">
          Offline Billing
        </h1>
        <p className="text-muted-foreground text-sm">
          Ring up in-store sales — search products, attach a customer, apply a
          coupon and print a receipt.
        </p>
      </div>

      <PosTerminal />
    </div>
  );
}

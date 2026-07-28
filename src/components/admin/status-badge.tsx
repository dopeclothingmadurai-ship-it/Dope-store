import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type Enums } from "@/types/database";

const PRODUCT_STATUS_STYLES: Record<Enums<"product_status">, string> = {
  active: "bg-success/15 text-success border-success/20",
  draft: "bg-muted text-muted-foreground border-border",
  archived: "bg-destructive/10 text-destructive border-destructive/20",
};

const PRODUCT_STATUS_LABELS: Record<Enums<"product_status">, string> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
};

export function ProductStatusBadge({
  status,
}: {
  status: Enums<"product_status">;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", PRODUCT_STATUS_STYLES[status])}
    >
      {PRODUCT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function ArchivedBadge({ archived }: { archived: boolean }) {
  return archived ? (
    <Badge
      variant="outline"
      className="bg-destructive/10 text-destructive border-destructive/20 font-medium"
    >
      Archived
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="bg-success/15 text-success border-success/20 font-medium"
    >
      Active
    </Badge>
  );
}

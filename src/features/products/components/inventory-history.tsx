import { format } from "date-fns";
import { History } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { type InventoryMovementItem } from "../types";

function humanizeReason(reason: string): string {
  return reason
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function InventoryHistory({
  movements,
}: {
  movements: InventoryMovementItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory history</CardTitle>
        <CardDescription>
          Every stock change is recorded through <code>adjust_inventory()</code>
          .
        </CardDescription>
      </CardHeader>

      {movements.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 px-6 pb-8 text-center text-sm">
          <History className="size-6" />
          <p>No stock movements yet.</p>
        </div>
      ) : (
        <CardContent className="p-0">
          <div className="overflow-x-auto border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">On hand after</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(
                        new Date(movement.created_at),
                        "dd MMM yyyy, HH:mm",
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {movement.sku}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums",
                        movement.delta > 0
                          ? "text-success"
                          : "text-destructive",
                      )}
                    >
                      {movement.delta > 0
                        ? `+${movement.delta}`
                        : movement.delta}
                    </TableCell>
                    <TableCell>{humanizeReason(movement.reason)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {movement.quantity_after}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {movement.reference || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

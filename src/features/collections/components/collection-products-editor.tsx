"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/admin/empty-state";
import { ProductStatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type Enums } from "@/types/database";

import { setCollectionProductsAction } from "../actions";

export type ProductOption = {
  id: string;
  title: string;
  status: Enums<"product_status">;
};

export function CollectionProductsEditor({
  collectionId,
  assigned,
  available,
}: {
  collectionId: string;
  assigned: ProductOption[];
  available: ProductOption[];
}) {
  const initialIds = useMemo(
    () => assigned.map((product) => product.id).join(","),
    [assigned],
  );
  const [items, setItems] = useState<ProductOption[]>(assigned);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const dirty = items.map((item) => item.id).join(",") !== initialIds;
  const assignedIds = new Set(items.map((item) => item.id));

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    return available
      .filter((product) => !assignedIds.has(product.id))
      .filter((product) =>
        term ? product.title.toLowerCase().includes(term) : true,
      )
      .slice(0, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, available, items]);

  function add(product: ProductOption) {
    setItems((current) => [...current, product]);
  }

  function remove(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function move(index: number, direction: -1 | 1) {
    setItems((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      const a = next[index];
      const b = next[target];
      if (!a || !b) return current;
      next[index] = b;
      next[target] = a;
      return next;
    });
  }

  async function save() {
    setSaving(true);
    const result = await setCollectionProductsAction(collectionId, {
      productIds: items.map((item) => item.id),
    });
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Products updated");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Assigned products ({items.length})</CardTitle>
          <CardDescription>
            Drag order with the arrows. Order controls storefront display.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No products assigned yet.
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((product, index) => (
                <li
                  key={product.id}
                  className="flex items-center gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <span className="text-muted-foreground w-5 text-right text-xs tabular-nums">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {product.title}
                    </p>
                  </div>
                  <ProductStatusBadge status={product.status} />
                  <div className="flex items-center">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp />
                      <span className="sr-only">Move up</span>
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={index === items.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown />
                      <span className="sr-only">Move down</span>
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => remove(product.id)}
                    >
                      <X />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add products</CardTitle>
          <CardDescription>Search the catalog to add products.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products…"
              className="pl-8"
            />
          </div>

          {matches.length === 0 ? (
            <EmptyState
              title={search ? "No matching products" : "All products assigned"}
              description={
                search
                  ? "Try a different search term."
                  : "Every available product is already in this collection."
              }
            />
          ) : (
            <ul className="max-h-80 divide-y overflow-y-auto">
              {matches.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center gap-2 py-2 first:pt-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {product.title}
                    </p>
                  </div>
                  <ProductStatusBadge status={product.status} />
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => add(product)}
                  >
                    <Plus />
                    <span className="sr-only">Add</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2 lg:col-span-2">
        {dirty ? (
          <span className="text-muted-foreground text-xs">
            You have unsaved changes.
          </span>
        ) : null}
        <Button onClick={save} disabled={!dirty || saving}>
          {saving ? "Saving…" : "Save products"}
        </Button>
      </div>
    </div>
  );
}

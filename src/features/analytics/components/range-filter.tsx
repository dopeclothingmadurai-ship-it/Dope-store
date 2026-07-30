"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { RANGE_OPTIONS } from "../range";
import { type DateRangeKey } from "../types";

export function RangeFilter({
  active,
  from,
  to,
  basePath = "/admin/analytics",
}: {
  active: DateRangeKey;
  from?: string;
  to?: string;
  basePath?: string;
}) {
  const router = useRouter();
  const [showCustom, setShowCustom] = useState(active === "custom");
  const [customFrom, setCustomFrom] = useState(from ?? "");
  const [customTo, setCustomTo] = useState(to ?? "");

  function selectRange(key: DateRangeKey) {
    if (key === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    router.push(`${basePath}?range=${key}`);
  }

  function applyCustom() {
    if (!customFrom) return;
    const params = new URLSearchParams({ range: "custom", from: customFrom });
    if (customTo) params.set("to", customTo);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {RANGE_OPTIONS.map((option) => {
          const isActive =
            option.key === "custom"
              ? active === "custom" || showCustom
              : active === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => selectRange(option.key)}
              className={cn(
                "h-8 rounded-lg border px-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-white/20 bg-white/[0.08] text-white"
                  : "text-muted-foreground border-transparent hover:bg-white/[0.04] hover:text-white",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {showCustom ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs">From</label>
            <Input
              type="date"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
              className="h-9 w-40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs">To</label>
            <Input
              type="date"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
              className="h-9 w-40"
            />
          </div>
          <Button size="sm" onClick={applyCustom} disabled={!customFrom}>
            Apply
          </Button>
        </div>
      ) : null}
    </div>
  );
}

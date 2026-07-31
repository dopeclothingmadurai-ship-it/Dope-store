"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { type ExportEntity, exportCsvAction } from "@/features/exports";

export function ExportButton({
  entity,
  label = "Export CSV",
}: {
  entity: ExportEntity;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    const res = await exportCsvAction(entity);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    const blob = new Blob([res.data.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = res.data.filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={run}
      disabled={loading}
      className="h-9"
    >
      {loading ? <Loader2 className="animate-spin" /> : <Download />}
      {label}
    </Button>
  );
}

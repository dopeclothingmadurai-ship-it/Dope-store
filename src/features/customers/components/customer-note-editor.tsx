"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { updateCustomerNoteAction } from "../actions";

export function CustomerNoteEditor({
  customerId,
  initialNote,
}: {
  customerId: string;
  initialNote: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialNote ?? "");
  const [pending, startTransition] = useTransition();
  const dirty = value.trim() !== (initialNote ?? "").trim();

  function save() {
    startTransition(async () => {
      const res = await updateCustomerNoteAction(customerId, {
        note: value.trim() ? value : null,
      });
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success("Note saved");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Private staff note about this customer."
        rows={4}
        className="resize-none"
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={save} disabled={!dirty || pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          Save note
        </Button>
      </div>
    </div>
  );
}

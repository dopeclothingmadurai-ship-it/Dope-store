"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { addOrderNoteAction, updateStaffNoteAction } from "../actions";

export function StaffNoteEditor({
  orderId,
  initialNote,
}: {
  orderId: string;
  initialNote: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialNote ?? "");
  const [pending, startTransition] = useTransition();
  const dirty = value.trim() !== (initialNote ?? "").trim();

  function save() {
    startTransition(async () => {
      const res = await updateStaffNoteAction(orderId, {
        note: value.trim() ? value : null,
      });
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success("Staff note saved");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Add an internal note for staff. Not visible to the customer."
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

export function AddNoteForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const message = value.trim();
    if (!message) return;
    startTransition(async () => {
      const res = await addOrderNoteAction(orderId, { message });
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success("Note added to timeline");
      setValue("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Record a manual note on the timeline…"
        rows={2}
        className="resize-none"
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={!value.trim() || pending}
        >
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
          Add to timeline
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function TagsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  }

  function remove(tag: string) {
    onChange(value.filter((item) => item !== tag));
  }

  return (
    <div className="space-y-2 rounded-lg border p-2">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                className="hover:text-foreground text-muted-foreground"
              >
                <X className="size-3" />
                <span className="sr-only">Remove {tag}</span>
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            add(draft);
          } else if (event.key === "Backspace" && !draft) {
            const last = value.at(-1);
            if (last) remove(last);
          }
        }}
        placeholder="Add a tag and press Enter"
        className="h-7 border-0 p-0 shadow-none focus-visible:ring-0"
      />
    </div>
  );
}

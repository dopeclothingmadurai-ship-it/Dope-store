"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { uploadImage } from "@/lib/media/upload-client";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 24;

/**
 * Ordered multi-image manager for the hero. Uploads go straight to Supabase
 * Storage via the existing signed-upload flow (no size downgrade); the admin
 * can add several at once, remove, and reorder. Order = display order.
 */
export function HeroImagesInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (images: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = MAX_IMAGES - value.length;
    if (room <= 0) {
      toast.error(`Up to ${MAX_IMAGES} hero images`);
      return;
    }
    const picked = Array.from(files).slice(0, room);
    setUploading(true);
    try {
      // Upload sequentially so ordering is predictable and we don't hammer
      // storage with a huge parallel burst.
      const uploaded: string[] = [];
      for (const file of picked) {
        uploaded.push(await uploadImage("homepage", file));
      }
      onChange([...value, ...uploaded]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const a = next[index];
    const b = next[target];
    if (a === undefined || b === undefined) return;
    next[index] = b;
    next[target] = a;
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="group border-input relative aspect-[3/4] overflow-hidden rounded-lg border"
          >
            <Image
              src={url}
              alt={`Hero image ${index + 1}`}
              fill
              unoptimized
              sizes="160px"
              className="object-cover"
            />
            {index === 0 ? (
              <span className="bg-black/70 text-warning absolute top-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wide">
                Primary
              </span>
            ) : null}
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => remove(index)}
              className="bg-black/70 hover:bg-black absolute top-1 right-1 flex size-6 items-center justify-center rounded-full text-white transition-colors"
            >
              <X className="size-3.5" />
            </button>
            <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                aria-label="Move earlier"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className="bg-black/70 hover:bg-black flex size-6 items-center justify-center rounded-full text-white transition-colors disabled:opacity-30"
              >
                <ArrowLeft className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="Move later"
                disabled={index === value.length - 1}
                onClick={() => move(index, 1)}
                className="bg-black/70 hover:bg-black flex size-6 items-center justify-center rounded-full text-white transition-colors disabled:opacity-30"
              >
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        ))}

        {value.length < MAX_IMAGES ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "border-input text-muted-foreground hover:border-ring hover:text-foreground flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-lg border border-dashed transition-colors",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Plus className="size-5" />
            )}
            <span className="text-[11px]">
              {uploading ? "Uploading…" : "Add image"}
            </span>
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <p className="text-muted-foreground text-xs">
        The first image is the primary. Drag order with the arrows. High-res
        editorial photography recommended — up to {MAX_IMAGES} images.
      </p>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Loader2, Star, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { uploadImage } from "@/lib/media/upload-client";
import { cn } from "@/lib/utils";

import {
  addProductMediaAction,
  deleteProductMediaAction,
  reorderProductMediaAction,
  setPrimaryProductMediaAction,
} from "../actions";
import { type ProductMedia } from "../types";

export function ProductMediaManager({
  productId,
  media,
}: {
  productId: string;
  media: ProductMedia[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [order, setOrder] = useState<ProductMedia[]>(media);
  const dragIndex = useRef<number | null>(null);

  // Keep local order in sync when the server data changes after a refresh.
  if (
    media.map((m) => m.id).join(",") !== order.map((m) => m.id).join(",") &&
    dragIndex.current === null &&
    !uploading
  ) {
    setOrder(media);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadImage("products", file);
        const result = await addProductMediaAction(productId, {
          url,
          alt: null,
        });
        if (!result.ok) throw new Error(result.error.message);
      }
      toast.success("Images uploaded");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function persistOrder(next: ProductMedia[]) {
    setOrder(next);
    const result = await reorderProductMediaAction(
      productId,
      next.map((item) => item.id),
    );
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    router.refresh();
  }

  function onDrop(dropIndex: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === dropIndex) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(dropIndex, 0, moved);
    void persistOrder(next);
  }

  async function makePrimary(id: string) {
    const result = await setPrimaryProductMediaAction(productId, id);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Primary image updated");
    router.refresh();
  }

  async function remove(id: string) {
    const result = await deleteProductMediaAction(productId, id);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Image removed");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Images</CardTitle>
        <CardDescription>
          Drag to reorder. The starred image is the primary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ")
              inputRef.current?.click();
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void handleFiles(event.dataTransfer.files);
          }}
          className={cn(
            "text-muted-foreground hover:bg-muted/50 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center transition-colors",
            dragging && "border-primary bg-muted/50",
          )}
        >
          {uploading ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <UploadCloud className="size-6" />
          )}
          <p className="text-sm">
            {uploading
              ? "Uploading…"
              : "Drop images here or click to upload (multiple allowed)"}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              void handleFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>

        {order.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {order.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => {
                  dragIndex.current = index;
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => onDrop(index)}
                className="group bg-muted relative aspect-square cursor-move overflow-hidden rounded-lg border"
              >
                <Image
                  src={item.url}
                  alt={item.alt ?? ""}
                  fill
                  unoptimized
                  sizes="200px"
                  className="object-cover"
                />
                {item.is_primary ? (
                  <span className="bg-background/90 absolute top-1.5 left-1.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium">
                    <Star className="fill-warning text-warning size-3" />
                    Primary
                  </span>
                ) : null}
                <div className="absolute right-1.5 bottom-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {!item.is_primary ? (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="secondary"
                      onClick={() => void makePrimary(item.id)}
                    >
                      <Star />
                      <span className="sr-only">Make primary</span>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="destructive"
                    onClick={() => void remove(item.id)}
                  >
                    <Trash2 />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No images yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

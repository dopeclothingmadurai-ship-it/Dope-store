"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { type MediaFolder } from "@/lib/media/service";
import { uploadImage } from "@/lib/media/upload-client";
import { cn } from "@/lib/utils";

export function SingleImageUpload({
  value,
  onChange,
  folder,
  disabled = false,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: MediaFolder;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(folder, file);
      onChange(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    return (
      <div className="relative w-full max-w-[180px] overflow-hidden rounded-lg border">
        <Image
          src={value}
          alt="Selected image"
          width={180}
          height={180}
          unoptimized
          className="aspect-square w-full object-cover"
        />
        <Button
          type="button"
          size="icon-sm"
          variant="destructive"
          className="absolute top-2 right-2"
          onClick={() => onChange(null)}
          disabled={disabled}
        >
          <X />
          <span className="sr-only">Remove image</span>
        </Button>
      </div>
    );
  }

  return (
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
        void handleFile(event.dataTransfer.files?.[0]);
      }}
      className={cn(
        "text-muted-foreground hover:bg-muted/50 flex aspect-square w-full max-w-[180px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center transition-colors",
        dragging && "border-primary bg-muted/50",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {uploading ? (
        <Loader2 className="size-6 animate-spin" />
      ) : (
        <UploadCloud className="size-6" />
      )}
      <p className="text-xs">
        {uploading ? "Uploading…" : "Drop image or click to upload"}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}

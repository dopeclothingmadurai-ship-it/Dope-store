import "server-only";

import { randomUUID } from "node:crypto";

import { StorageError } from "@/lib/errors";
import {
  PRODUCT_MEDIA_BUCKET,
  fileExtension,
  publicStorageUrl,
} from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";

export type MediaFolder =
  | "products"
  | "categories"
  | "collections"
  | "homepage";

export type SignedUpload = {
  path: string;
  token: string;
  publicUrl: string;
};

const ALLOWED_IMAGE_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
  "gif",
]);

/**
 * Create a short-lived signed upload URL for the `product-media` bucket. The
 * browser uploads the file directly to storage using the returned token, so
 * large images never pass through a Server Action body.
 */
export async function createProductMediaUpload(
  folder: MediaFolder,
  fileName: string,
): Promise<SignedUpload> {
  const ext = fileExtension(fileName);
  if (!ALLOWED_IMAGE_EXT.has(ext)) {
    throw new StorageError(
      "Unsupported image type. Use JPG, PNG, WEBP, AVIF or GIF.",
    );
  }

  const path = `${folder}/${randomUUID()}.${ext}`;
  const db = createAdminClient();
  const { data, error } = await db.storage
    .from(PRODUCT_MEDIA_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new StorageError(error?.message ?? "Could not create an upload URL.");
  }

  return {
    path: data.path,
    token: data.token,
    publicUrl: publicStorageUrl(PRODUCT_MEDIA_BUCKET, data.path),
  };
}

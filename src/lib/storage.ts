import { clientEnv } from "@/lib/env/client";

/** Storage buckets (created in the Phase 1 migration). */
export const PRODUCT_MEDIA_BUCKET = "product-media";
export const HOMEPAGE_MEDIA_BUCKET = "homepage-media";

/**
 * Build the public URL for an object in a public bucket. Safe on both server
 * and client — uses only the public Supabase URL.
 */
export function publicStorageUrl(bucket: string, path: string): string {
  return `${clientEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/** Derive a lowercase file extension (without dot) from a filename. */
export function fileExtension(fileName: string): string {
  const ext = /\.([a-zA-Z0-9]+)$/.exec(fileName)?.[1];
  return ext ? ext.toLowerCase() : "bin";
}

/**
 * Extract the in-bucket object path from a public URL, or null if the URL does
 * not point at the given bucket. Used to clean up stored files on delete.
 */
export function pathFromPublicUrl(bucket: string, url: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

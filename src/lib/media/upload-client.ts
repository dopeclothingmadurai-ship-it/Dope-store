import { PRODUCT_MEDIA_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

import { createMediaUploadUrlAction } from "./actions";
import { type MediaFolder } from "./service";

/**
 * Upload a single image from the browser: ask the server for a signed upload
 * URL, then upload the file directly to Supabase Storage. Returns the public
 * URL of the stored object. Throws on failure (callers surface a toast).
 */
export async function uploadImage(
  folder: MediaFolder,
  file: File,
): Promise<string> {
  const result = await createMediaUploadUrlAction({
    folder,
    fileName: file.name,
  });
  if (!result.ok) {
    throw new Error(result.error.message);
  }

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(PRODUCT_MEDIA_BUCKET)
    .uploadToSignedUrl(result.data.path, result.data.token, file, {
      contentType: file.type,
    });

  if (error) {
    throw new Error(error.message);
  }

  return result.data.publicUrl;
}

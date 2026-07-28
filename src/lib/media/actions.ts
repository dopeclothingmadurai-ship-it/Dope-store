"use server";

import { z } from "zod";

import { runStaffAction } from "@/lib/auth/guard";
import { type Result } from "@/lib/result";

import { type SignedUpload, createProductMediaUpload } from "./service";

const uploadUrlSchema = z.object({
  folder: z.enum(["products", "categories", "collections"]),
  fileName: z.string().trim().min(1, "Missing file name").max(255),
});

export async function createMediaUploadUrlAction(
  input: unknown,
): Promise<Result<SignedUpload>> {
  return runStaffAction(async () => {
    const { folder, fileName } = uploadUrlSchema.parse(input);
    return createProductMediaUpload(folder, fileName);
  });
}

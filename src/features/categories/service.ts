import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import { type CategoryFormValues } from "./schema";
import { type Category } from "./types";

function normalizeDescription(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createCategory(
  input: CategoryFormValues,
): Promise<Category> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("categories")
    .insert({
      name: input.name,
      slug: input.slug,
      description: normalizeDescription(input.description),
      image_url: input.imageUrl,
      position: input.position,
    })
    .select("*")
    .single();

  if (error) throw fromPostgrestError(error);
  return data;
}

export async function updateCategory(
  id: string,
  input: CategoryFormValues,
): Promise<Category> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("categories")
    .update({
      name: input.name,
      slug: input.slug,
      description: normalizeDescription(input.description),
      image_url: input.imageUrl,
      position: input.position,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw fromPostgrestError(error);
  return data;
}

export async function archiveCategory(id: string): Promise<Category> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("categories")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw fromPostgrestError(error);
  return data;
}

export async function restoreCategory(id: string): Promise<Category> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("categories")
    .update({ archived_at: null })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw fromPostgrestError(error);
  return data;
}

/** Persist a new ordering. Positions are assigned by array index. */
export async function reorderCategories(orderedIds: string[]): Promise<void> {
  const db = createAdminClient();
  for (const [index, id] of orderedIds.entries()) {
    const { error } = await db
      .from("categories")
      .update({ position: index })
      .eq("id", id);
    if (error) throw fromPostgrestError(error);
  }
}

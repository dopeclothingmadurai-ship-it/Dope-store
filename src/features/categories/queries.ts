import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import { type Category } from "./types";

/** All categories (including archived), ordered for the admin list. */
export async function listCategories(): Promise<Category[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("categories")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw fromPostgrestError(error);
  return data;
}

/** Non-archived categories as `{ id, name }` options for selects. */
export async function listCategoryOptions(): Promise<
  { id: string; name: string }[]
> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("categories")
    .select("id, name")
    .is("archived_at", null)
    .order("position", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function getCategory(id: string): Promise<Category | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw fromPostgrestError(error);
  return data;
}

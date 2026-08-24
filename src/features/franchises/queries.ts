import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import { type Franchise } from "./types";

/** All franchises for the admin, newest first. */
export async function listFranchises(): Promise<Franchise[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("franchises")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw fromPostgrestError(error);
  return data;
}

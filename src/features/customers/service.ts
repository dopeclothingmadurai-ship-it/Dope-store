import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import { type Customer } from "./types";

export async function updateCustomerNote(
  id: string,
  note: string | null,
): Promise<Customer> {
  const db = createAdminClient();
  const trimmed = note?.trim() ? note.trim() : null;
  const { data, error } = await db
    .from("customers")
    .update({ note: trimmed })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

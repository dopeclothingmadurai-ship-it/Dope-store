import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import { type FranchiseFormValues } from "./schema";
import { type Franchise } from "./types";

function toRow(input: FranchiseFormValues) {
  return {
    name: input.name.trim(),
    city: input.city,
    location: input.location,
    phone: input.phone,
    email: input.email,
    address: input.address,
    status: input.status,
    notes: input.notes,
  };
}

export async function createFranchise(
  input: FranchiseFormValues,
): Promise<Franchise> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("franchises")
    .insert(toRow(input))
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function updateFranchise(
  id: string,
  input: FranchiseFormValues,
): Promise<Franchise> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("franchises")
    .update(toRow(input))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

/** Toggle active/inactive without opening the editor. */
export async function setFranchiseStatus(
  id: string,
  status: "active" | "inactive",
): Promise<Franchise> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("franchises")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function deleteFranchise(id: string): Promise<void> {
  const db = createAdminClient();
  const { error } = await db.from("franchises").delete().eq("id", id);
  if (error) throw fromPostgrestError(error);
}

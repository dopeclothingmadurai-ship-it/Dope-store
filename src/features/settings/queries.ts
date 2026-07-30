import "server-only";

import { clientEnv } from "@/lib/env/client";
import { serverEnv } from "@/lib/env/server";
import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  type IntegrationStatus,
  type StaffMember,
  type StaffRole,
  type StoreSettings,
} from "./types";

export async function getStoreSettings(): Promise<StoreSettings> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("store_settings")
    .select("*")
    .eq("id", true)
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

/** Staff members: staff_profiles joined to their auth email. */
export async function listStaff(currentUserId: string): Promise<StaffMember[]> {
  const db = createAdminClient();
  const { data: profiles, error } = await db
    .from("staff_profiles")
    .select("id, role, created_at")
    .order("created_at", { ascending: true });
  if (error) throw fromPostgrestError(error);

  const { data: users } = await db.auth.admin.listUsers({ perPage: 200 });
  const emailById = new Map(
    (users?.users ?? []).map((user) => [user.id, user.email ?? "—"]),
  );

  return profiles.map((profile) => ({
    id: profile.id,
    email: emailById.get(profile.id) ?? "—",
    role: profile.role as StaffRole,
    createdAt: profile.created_at,
    isSelf: profile.id === currentUserId,
  }));
}

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  const db = createAdminClient();
  const { error } = await db
    .from("store_settings")
    .select("id", { head: true, count: "exact" })
    .eq("id", true);

  let projectRef = "";
  try {
    projectRef =
      new URL(clientEnv.NEXT_PUBLIC_SUPABASE_URL).host.split(".")[0] ?? "";
  } catch {
    projectRef = "";
  }

  return {
    razorpaySecretConfigured: Boolean(serverEnv.RAZORPAY_KEY_SECRET),
    razorpayWebhookConfigured: Boolean(serverEnv.RAZORPAY_WEBHOOK_SECRET),
    supabaseConnected: !error,
    supabaseProjectRef: projectRef,
  };
}

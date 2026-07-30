import { type Tables } from "@/types/database";

export type StoreSettings = Tables<"store_settings">;

export type StaffRole = "owner" | "manager" | "editor" | "staff";

export type StaffMember = {
  id: string;
  email: string;
  role: StaffRole;
  createdAt: string;
  isSelf: boolean;
};

export type StoreAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
};

/** Non-secret indicators about the server environment for the Payments tab. */
export type IntegrationStatus = {
  razorpaySecretConfigured: boolean;
  razorpayWebhookConfigured: boolean;
  supabaseConnected: boolean;
  supabaseProjectRef: string;
};

export type {
  StoreProfileValues,
  TaxShippingValues,
  PaymentsValues,
} from "./schema";

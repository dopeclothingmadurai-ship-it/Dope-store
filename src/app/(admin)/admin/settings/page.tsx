import { redirect } from "next/navigation";

import { SettingsView } from "@/features/settings/components/settings-view";
import {
  getIntegrationStatus,
  getStoreSettings,
  listStaff,
} from "@/features/settings/queries";
import { getAuthUser } from "@/lib/auth/staff";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const [settings, staff, status] = await Promise.all([
    getStoreSettings(),
    listStaff(user.id),
    getIntegrationStatus(),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-white">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure your store, payments, team and data.
        </p>
      </div>

      <SettingsView settings={settings} staff={staff} status={status} />
    </div>
  );
}

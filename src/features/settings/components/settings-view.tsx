"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  type IntegrationStatus,
  type StaffMember,
  type StoreSettings,
} from "../types";
import { DangerZone } from "./danger-zone";
import { SecuritySection } from "./security-section";
import { StaffSection } from "./staff-section";
import {
  BrandingSection,
  PaymentsSection,
  StoreProfileForm,
  TaxShippingForm,
} from "./store-forms";

const TABS = [
  { value: "store", label: "Store" },
  { value: "payments", label: "Payments" },
  { value: "branding", label: "Branding" },
  { value: "team", label: "Team" },
  { value: "danger", label: "Danger" },
];

export function SettingsView({
  settings,
  staff,
  status,
}: {
  settings: StoreSettings;
  staff: StaffMember[];
  status: IntegrationStatus;
}) {
  return (
    <Tabs defaultValue="store" className="gap-6">
      <TabsList variant="line" className="w-full justify-start overflow-x-auto">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="store" className="space-y-6">
        <StoreProfileForm settings={settings} />
        <TaxShippingForm settings={settings} />
      </TabsContent>

      <TabsContent value="payments">
        <PaymentsSection settings={settings} status={status} />
      </TabsContent>

      <TabsContent value="branding">
        <BrandingSection settings={settings} />
      </TabsContent>

      <TabsContent value="team" className="space-y-6">
        <StaffSection staff={staff} />
        <SecuritySection />
      </TabsContent>

      <TabsContent value="danger">
        <DangerZone />
      </TabsContent>
    </Tabs>
  );
}

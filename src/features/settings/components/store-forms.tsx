"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { FormRow } from "@/components/admin/form-row";
import { PriceInput } from "@/components/admin/price-input";
import { SectionCard } from "@/components/admin/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { applyServerErrors } from "@/lib/forms";
import { cn } from "@/lib/utils";

import {
  updateMaintenanceAction,
  updatePaymentsAction,
  updateStoreProfileAction,
  updateTaxShippingAction,
} from "../actions";
import {
  paymentsSchema,
  storeProfileSchema,
  taxShippingSchema,
  type PaymentsValues,
  type StoreProfileValues,
  type TaxShippingValues,
} from "../schema";
import { type IntegrationStatus, type StoreSettings } from "../types";

function toAddress(settings: StoreSettings): StoreProfileValues["address"] {
  const raw = (settings.address ?? {}) as Record<string, string | null>;
  return {
    line1: raw.line1 ?? null,
    line2: raw.line2 ?? null,
    city: raw.city ?? null,
    state: raw.state ?? null,
    pincode: raw.pincode ?? null,
    country: raw.country ?? null,
  };
}

export function StoreProfileForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StoreProfileValues>({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: {
      storeName: settings.store_name,
      supportEmail: settings.support_email,
      supportPhone: settings.support_phone,
      gstNumber: settings.gst_number,
      address: toAddress(settings),
      currency: settings.currency,
      timezone: settings.timezone,
      logoUrl: settings.logo_url,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const res = await updateStoreProfileAction(values);
    if (!res.ok) {
      applyServerErrors(res.error, setError);
      toast.error(res.error.message);
      return;
    }
    toast.success("Store details saved");
    router.refresh();
  });

  return (
    <SectionCard title="Store" description="Business identity and contact.">
      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormRow
            label="Store name"
            required
            error={errors.storeName?.message}
          >
            <Input {...register("storeName")} />
          </FormRow>
          <FormRow label="Logo URL" error={errors.logoUrl?.message}>
            <Input placeholder="https://…" {...register("logoUrl")} />
          </FormRow>
          <FormRow label="Support email" error={errors.supportEmail?.message}>
            <Input
              placeholder="hello@dopestore.com"
              {...register("supportEmail")}
            />
          </FormRow>
          <FormRow label="Support phone" error={errors.supportPhone?.message}>
            <Input {...register("supportPhone")} />
          </FormRow>
          <FormRow label="GST number" error={errors.gstNumber?.message}>
            <Input {...register("gstNumber")} />
          </FormRow>
          <div className="grid grid-cols-2 gap-4">
            <FormRow label="Currency" error={errors.currency?.message}>
              <Input {...register("currency")} />
            </FormRow>
            <FormRow label="Timezone" error={errors.timezone?.message}>
              <Input {...register("timezone")} />
            </FormRow>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border p-4">
          <p className="text-sm font-medium text-white">Registered address</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormRow label="Address line 1">
              <Input {...register("address.line1")} />
            </FormRow>
            <FormRow label="Address line 2">
              <Input {...register("address.line2")} />
            </FormRow>
            <FormRow label="City">
              <Input {...register("address.city")} />
            </FormRow>
            <FormRow label="State">
              <Input {...register("address.state")} />
            </FormRow>
            <FormRow label="Pincode">
              <Input {...register("address.pincode")} />
            </FormRow>
            <FormRow label="Country">
              <Input {...register("address.country")} />
            </FormRow>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

export function TaxShippingForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setError,
    register,
    formState: { errors, isSubmitting },
  } = useForm<TaxShippingValues>({
    resolver: zodResolver(taxShippingSchema),
    defaultValues: {
      taxRateBps: settings.tax_rate_bps,
      shippingFlat: settings.shipping_flat,
      freeShippingThreshold: settings.free_shipping_threshold,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const res = await updateTaxShippingAction(values);
    if (!res.ok) {
      applyServerErrors(res.error, setError);
      toast.error(res.error.message);
      return;
    }
    toast.success("Tax & shipping saved");
    router.refresh();
  });

  return (
    <SectionCard title="Tax & shipping" description="Applied at point of sale.">
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-3">
        <FormRow
          label="Tax rate (bps)"
          hint="500 = 5%"
          error={errors.taxRateBps?.message}
        >
          <Input
            type="number"
            min={0}
            max={10000}
            {...register("taxRateBps")}
          />
        </FormRow>
        <FormRow label="Flat shipping" error={errors.shippingFlat?.message}>
          <Controller
            control={control}
            name="shippingFlat"
            render={({ field }) => (
              <PriceInput
                value={field.value}
                onChange={(v) => field.onChange(v ?? 0)}
              />
            )}
          />
        </FormRow>
        <FormRow
          label="Free shipping over"
          hint="Blank = never"
          error={errors.freeShippingThreshold?.message}
        >
          <Controller
            control={control}
            name="freeShippingThreshold"
            render={({ field }) => (
              <PriceInput
                allowNull
                value={field.value}
                onChange={(v) => field.onChange(v)}
              />
            )}
          />
        </FormRow>
        <div className="flex justify-end sm:col-span-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-medium",
          ok ? "text-emerald-400" : "text-red-400",
        )}
      >
        {ok ? (
          <CheckCircle2 className="size-4" />
        ) : (
          <XCircle className="size-4" />
        )}
        {ok ? "Configured" : "Missing"}
      </span>
    </div>
  );
}

export function PaymentsSection({
  settings,
  status,
}: {
  settings: StoreSettings;
  status: IntegrationStatus;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaymentsValues>({
    resolver: zodResolver(paymentsSchema),
    defaultValues: { razorpayKeyId: settings.razorpay_key_id },
  });

  const onSubmit = handleSubmit(async (values) => {
    const res = await updatePaymentsAction(values);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Payment settings saved");
    router.refresh();
  });

  return (
    <div className="space-y-6">
      <SectionCard title="Payments" description="Razorpay public key id only.">
        <form onSubmit={onSubmit} className="grid gap-4">
          <FormRow
            label="Razorpay Key ID"
            hint="Public identifier — safe to store. The secret key never leaves the server."
            error={errors.razorpayKeyId?.message}
          >
            <Input
              placeholder="rzp_live_…"
              className="font-mono"
              {...register("razorpayKeyId")}
            />
          </FormRow>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Server integrations"
        description="Read-only. Secrets stay in server environment."
      >
        <div className="divide-border/60 divide-y">
          <StatusRow
            label="Razorpay secret key"
            ok={status.razorpaySecretConfigured}
          />
          <StatusRow
            label="Razorpay webhook secret"
            ok={status.razorpayWebhookConfigured}
          />
          <StatusRow
            label="Supabase connection"
            ok={status.supabaseConnected}
          />
          <div className="flex items-center justify-between py-2 text-sm">
            <span className="text-muted-foreground">Supabase project</span>
            <span className="font-mono text-xs">
              {status.supabaseProjectRef}
            </span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export function BrandingSection({ settings }: { settings: StoreSettings }) {
  const router = useRouter();

  async function toggleMaintenance(next: boolean) {
    const res = await updateMaintenanceAction({ maintenanceMode: next });
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(next ? "Maintenance mode on" : "Maintenance mode off");
    router.refresh();
  }

  const swatches: { name: string; className: string }[] = [
    { name: "Background", className: "bg-background" },
    { name: "Card", className: "bg-card" },
    { name: "Border", className: "border border-border bg-transparent" },
    { name: "Primary", className: "bg-primary" },
    { name: "Success", className: "bg-success" },
    { name: "Warning", className: "bg-warning" },
    { name: "Destructive", className: "bg-destructive" },
  ];

  return (
    <div className="space-y-6">
      <SectionCard
        title="Branding"
        description="The admin uses a dark, luxury theme."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {swatches.map((swatch) => (
            <div key={swatch.name} className="space-y-1.5">
              <div className={cn("h-12 rounded-lg", swatch.className)} />
              <p className="text-muted-foreground text-xs">{swatch.name}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Maintenance mode">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-white">
              Put the storefront in maintenance
            </p>
            <p className="text-muted-foreground text-xs">
              A flag other surfaces can read to pause public shopping. The admin
              stays fully accessible.
            </p>
          </div>
          <Switch
            checked={settings.maintenance_mode}
            onCheckedChange={toggleMaintenance}
          />
        </div>
      </SectionCard>
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormRow } from "@/components/admin/form-row";
import { SectionCard } from "@/components/admin/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

import { passwordChangeSchema, type PasswordChangeValues } from "../schema";

export function SecuritySection() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { password: "", confirm: "" },
  });

  // The signed-in user updates their own password directly against Supabase Auth.
  const onSubmit = handleSubmit(async (values) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    reset({ password: "", confirm: "" });
  });

  return (
    <SectionCard
      title="Security"
      description="Change your own sign-in password."
    >
      <form onSubmit={onSubmit} className="grid max-w-md gap-4">
        <FormRow label="New password" required error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
        </FormRow>
        <FormRow
          label="Confirm password"
          required
          error={errors.confirm?.message}
        >
          <Input
            type="password"
            autoComplete="new-password"
            {...register("confirm")}
          />
        </FormRow>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

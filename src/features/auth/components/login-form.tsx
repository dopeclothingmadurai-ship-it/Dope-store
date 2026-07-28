"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { OctagonAlert } from "lucide-react";

import { FormRow } from "@/components/admin/form-row";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { applyServerErrors } from "@/lib/forms";

import { signInAction } from "../actions";
import { loginSchema, type LoginValues } from "../schema";

/** Only allow internal admin redirects (no open redirect). */
function safeNext(next: string | null): string {
  return next && next.startsWith("/admin") ? next : "/admin/catalog/products";
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [formError, setFormError] = useState<string | null>(
    params.get("error") === "unauthorized"
      ? "This account is not authorized for the admin."
      : null,
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await signInAction(values);
    if (!result.ok) {
      applyServerErrors(result.error, setError);
      setFormError(result.error.message);
      return;
    }
    router.replace(next);
    router.refresh();
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="bg-primary text-primary-foreground mb-1 flex size-9 items-center justify-center rounded-lg text-base font-semibold">
          D
        </div>
        <CardTitle className="text-lg">Dope Store Admin</CardTitle>
        <CardDescription>Sign in with your staff account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          {formError ? (
            <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm">
              <OctagonAlert className="mt-0.5 size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          ) : null}

          <FormRow label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              {...register("email")}
            />
          </FormRow>

          <FormRow
            label="Password"
            htmlFor="password"
            error={errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
          </FormRow>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

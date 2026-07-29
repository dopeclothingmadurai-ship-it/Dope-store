"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { OctagonAlert } from "lucide-react";

import { FormRow } from "@/components/admin/form-row";
import { Button } from "@/components/ui/button";
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
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="relative z-10 w-full max-w-sm rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 shadow-2xl shadow-black/40 backdrop-blur-xl"
    >
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-gradient-to-b from-white to-white/70 text-lg font-bold text-black shadow-lg">
          D
        </span>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Sign in to the Dope Store admin.
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4">
        {formError ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-destructive/10 text-destructive border-destructive/20 flex items-start gap-2 rounded-lg border p-3 text-sm"
          >
            <OctagonAlert className="mt-0.5 size-4 shrink-0" />
            <span>{formError}</span>
          </motion.div>
        ) : null}

        <FormRow label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@dopestore.com"
            className="h-10"
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
            placeholder="••••••••"
            className="h-10"
            {...register("password")}
          />
        </FormRow>

        <Button
          type="submit"
          className="mt-1 h-10 w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </motion.div>
  );
}

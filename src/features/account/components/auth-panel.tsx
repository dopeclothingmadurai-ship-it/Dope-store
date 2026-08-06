"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { OctagonAlert } from "lucide-react";

import { applyServerErrors } from "@/lib/forms";
import { cn } from "@/lib/utils";

import { registerCustomerAction, signInCustomerAction } from "../actions";
import {
  type CustomerRegisterValues,
  customerLoginSchema,
  customerRegisterSchema,
} from "../schema";

type Mode = "sign-in" | "register";

/** Only allow internal storefront redirects (no open redirect). */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/account";
}

const inputClass =
  "border-input bg-secondary/60 text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:ring-gold/30 h-12 w-full border px-4 text-sm transition-colors outline-none focus:ring-1";

export function AuthPanel({ mode, next }: { mode: Mode; next: string | null }) {
  const router = useRouter();
  const destination = safeNext(next);
  const [formError, setFormError] = useState<string | null>(null);

  // One form type covers both modes; name is ignored when signing in.
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CustomerRegisterValues>({
    // Both schemas share email + password; `name` is only validated (and only
    // present in the UI) when registering, so the register value type is safe.
    resolver: zodResolver(
      mode === "register" ? customerRegisterSchema : customerLoginSchema,
    ) as unknown as Resolver<CustomerRegisterValues>,
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result =
      mode === "register"
        ? await registerCustomerAction(values)
        : await signInCustomerAction({
            email: values.email,
            password: values.password,
          });
    if (!result.ok) {
      applyServerErrors(result.error, setError);
      setFormError(result.error.message);
      return;
    }
    router.replace(destination);
    router.refresh();
  });

  const isRegister = mode === "register";
  const suffix = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md"
    >
      <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
        {isRegister ? "Join Dope" : "Welcome back"}
      </p>
      <h1 className="font-display mt-3 text-4xl font-light tracking-tight sm:text-5xl">
        {isRegister ? "Create account" : "Sign in"}
      </h1>
      <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
        {isRegister
          ? "Track your orders and review the pieces you own."
          : "Access your orders and reviews."}
      </p>

      <form onSubmit={onSubmit} className="mt-10 grid gap-5">
        {formError ? (
          <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 border px-4 py-3 text-sm">
            <OctagonAlert className="mt-0.5 size-4 shrink-0" />
            <span>{formError}</span>
          </div>
        ) : null}

        {isRegister ? (
          <Field label="Name" error={errors.name?.message}>
            <input
              type="text"
              autoComplete="name"
              autoFocus
              placeholder="Your name"
              className={inputClass}
              {...register("name")}
            />
          </Field>
        ) : null}

        <Field label="Email" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            autoFocus={!isRegister}
            placeholder="you@email.com"
            className={inputClass}
            {...register("email")}
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <input
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder="••••••••"
            className={inputClass}
            {...register("password")}
          />
        </Field>

        {!isRegister ? (
          <Link
            href="/account/forgot-password"
            className="text-muted-foreground hover:text-foreground -mt-2 w-fit text-xs transition-colors"
          >
            Forgot password?
          </Link>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-foreground text-background mt-2 flex h-12 w-full items-center justify-center text-[12px] font-medium tracking-[0.2em] uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting
            ? "Please wait…"
            : isRegister
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="text-muted-foreground mt-8 text-sm">
        {isRegister ? "Already have an account? " : "New to Dope? "}
        <Link
          href={`${isRegister ? "/account/sign-in" : "/account/register"}${suffix}`}
          className="text-foreground hover:text-gold underline underline-offset-4 transition-colors"
        >
          {isRegister ? "Sign in" : "Create one"}
        </Link>
      </p>
    </motion.div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-foreground/80 text-[11px] font-medium tracking-[0.18em] uppercase">
        {label}
      </span>
      <div className="mt-2">{children}</div>
      <span
        className={cn(
          "text-destructive mt-1.5 block text-xs",
          error ? "visible" : "invisible",
        )}
      >
        {error ?? "placeholder"}
      </span>
    </label>
  );
}

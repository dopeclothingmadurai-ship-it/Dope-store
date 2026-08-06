"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Check, OctagonAlert } from "lucide-react";

import { requestPasswordResetAction } from "../actions";

const inputClass =
  "border-input bg-secondary/60 text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:ring-gold/30 h-12 w-full border px-4 text-sm transition-colors outline-none focus:ring-1";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await requestPasswordResetAction({ email });
    setLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="w-full max-w-md">
      <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
        Reset access
      </p>
      <h1 className="font-display mt-3 text-4xl font-light tracking-tight sm:text-5xl">
        Forgot password
      </h1>

      {sent ? (
        <div className="border-gold/30 bg-gold/5 mt-8 flex items-start gap-2 border p-4 text-sm">
          <Check className="text-gold mt-0.5 size-4 shrink-0" />
          <span className="text-foreground/85">
            If an account exists for that email, a reset link is on its way.
            Check your inbox.
          </span>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            Enter your email and we&apos;ll send you a link to reset your
            password.
          </p>
          <form onSubmit={onSubmit} className="mt-8 grid gap-5">
            {error ? (
              <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 border px-4 py-3 text-sm">
                <OctagonAlert className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
            <input
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@email.com"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-foreground text-background flex h-12 w-full items-center justify-center text-[12px] font-medium tracking-[0.2em] uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        </>
      )}

      <p className="text-muted-foreground mt-8 text-sm">
        <Link
          href="/account/sign-in"
          className="text-foreground hover:text-gold underline underline-offset-4 transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

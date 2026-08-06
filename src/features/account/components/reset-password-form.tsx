"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { OctagonAlert } from "lucide-react";

import { resetPasswordAction } from "../actions";

const inputClass =
  "border-input bg-secondary/60 text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:ring-gold/30 h-12 w-full border px-4 text-sm transition-colors outline-none focus:ring-1";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    const result = await resetPasswordAction({ password });
    setLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.replace("/account");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
        Almost done
      </p>
      <h1 className="font-display mt-3 text-4xl font-light tracking-tight sm:text-5xl">
        New password
      </h1>
      <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
        Choose a new password for your account.
      </p>

      <form onSubmit={onSubmit} className="mt-8 grid gap-5">
        {error ? (
          <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 border px-4 py-3 text-sm">
            <OctagonAlert className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        <input
          type="password"
          autoComplete="new-password"
          autoFocus
          placeholder="New password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Confirm new password"
          className={inputClass}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-foreground text-background flex h-12 w-full items-center justify-center text-[12px] font-medium tracking-[0.2em] uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

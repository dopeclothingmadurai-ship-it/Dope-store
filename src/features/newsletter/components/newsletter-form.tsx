"use client";

import { type FormEvent, useState } from "react";
import { ArrowRight, Check } from "lucide-react";

import { subscribeNewsletterAction } from "../actions";

type Status = "idle" | "loading" | "done" | "error";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    const result = await subscribeNewsletterAction({ email });
    if (!result.ok) {
      setStatus("error");
      setError(result.error.message);
      return;
    }
    setStatus("done");
    setEmail("");
  }

  if (status === "done") {
    return (
      <p className="text-gold flex items-center gap-2 text-sm">
        <Check className="size-4" /> You’re on the list.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="border-border focus-within:border-foreground/60 flex items-center border-b pb-2 transition-colors">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          aria-label="Email address"
          required
          className="text-foreground placeholder:text-muted-foreground/70 min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          aria-label="Subscribe"
          className="text-foreground/70 hover:text-foreground shrink-0 pl-3 transition-colors disabled:opacity-50"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>
      {error ? <p className="text-destructive mt-2 text-xs">{error}</p> : null}
    </form>
  );
}

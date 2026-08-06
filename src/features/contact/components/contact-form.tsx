"use client";

import { type FormEvent, useState } from "react";
import { Check, OctagonAlert } from "lucide-react";

import { cn } from "@/lib/utils";

import { submitContactAction } from "../actions";

const inputClass =
  "border-input bg-secondary/60 text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:ring-gold/30 w-full border px-4 text-sm transition-colors outline-none focus:ring-1";

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await submitContactAction(form);
    setLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setSent(true);
    setForm({ name: "", email: "", subject: "", message: "" });
  }

  if (sent) {
    return (
      <div className="border-gold/30 bg-gold/5 flex items-start gap-3 rounded-lg border p-6">
        <Check className="text-gold mt-0.5 size-5 shrink-0" />
        <div>
          <p className="text-foreground text-sm font-medium">
            Message received.
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Thank you — our team will get back to you shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {error ? (
        <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 border px-4 py-3 text-sm">
          <OctagonAlert className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          className={cn(inputClass, "h-12")}
          placeholder="Your name"
          autoComplete="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className={cn(inputClass, "h-12")}
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>
      <input
        className={cn(inputClass, "h-12")}
        placeholder="Subject (optional)"
        value={form.subject}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
      />
      <textarea
        className={cn(inputClass, "min-h-40 resize-y py-3")}
        placeholder="How can we help?"
        rows={6}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-foreground text-background flex h-12 w-full items-center justify-center text-[12px] font-medium tracking-[0.2em] uppercase transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {loading ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

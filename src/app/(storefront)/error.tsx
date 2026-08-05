"use client";

import { useEffect } from "react";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for observability; the message itself is never shown to users.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
        Something went wrong
      </p>
      <h1 className="font-display mt-4 text-3xl font-light tracking-tight sm:text-4xl">
        We hit a snag
      </h1>
      <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-relaxed">
        Please try again in a moment. If it keeps happening, come back shortly.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-foreground text-background mt-8 flex h-12 items-center justify-center px-8 text-[12px] font-medium tracking-[0.2em] uppercase transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}

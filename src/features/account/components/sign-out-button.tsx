"use client";

import { signOutCustomerAction } from "../actions";

export function SignOutButton() {
  return (
    <form action={signOutCustomerAction}>
      <button
        type="submit"
        className="text-muted-foreground hover:text-foreground text-[11px] font-medium tracking-[0.18em] uppercase transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}

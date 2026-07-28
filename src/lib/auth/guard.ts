import "server-only";

import { runAction } from "@/lib/errors";
import { type Result } from "@/lib/result";

import { requireStaff } from "./staff";

/**
 * Like `runAction`, but rejects non-staff callers before running the body.
 * Every admin mutation Server Action uses this so the action surface is
 * protected, not just the pages.
 */
export async function runStaffAction<T>(
  fn: () => Promise<T>,
): Promise<Result<T>> {
  return runAction(async () => {
    await requireStaff();
    return fn();
  });
}

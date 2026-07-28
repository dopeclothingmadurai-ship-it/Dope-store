import {
  type FieldValues,
  type Path,
  type UseFormSetError,
} from "react-hook-form";

import { type ActionError } from "@/lib/result";

/**
 * Map an action's field-level validation errors back onto a React Hook Form,
 * so the offending inputs are highlighted with server messages.
 */
export function applyServerErrors<T extends FieldValues>(
  error: ActionError,
  setError: UseFormSetError<T>,
): void {
  if (!error.fieldErrors) return;
  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    const message = messages[0];
    if (message) {
      setError(field as Path<T>, { message });
    }
  }
}

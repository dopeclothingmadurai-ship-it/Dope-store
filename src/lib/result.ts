/**
 * Result<T> — the single return contract for every Server Action mutation.
 *
 * Actions never throw across the client boundary; they return a discriminated
 * result the UI can branch on. Field-level validation errors travel in
 * `error.fieldErrors` so forms can highlight the offending inputs.
 */
export type ActionError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type Result<T> =
  { ok: true; data: T } | { ok: false; error: ActionError };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err(error: ActionError): Result<never> {
  return { ok: false, error };
}

import { type PostgrestError } from "@supabase/supabase-js";
import { ZodError } from "zod";

import { type ActionError, type Result, err, ok } from "@/lib/result";

/**
 * Typed application errors thrown inside the service layer. The action boundary
 * (`runAction`) converts them into a safe `ActionError` for the client.
 */
export class AppError extends Error {
  readonly code: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    code: string,
    message: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super("validation_error", message, fieldErrors);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested item was not found.") {
    super("not_found", message);
    this.name = "NotFoundError";
  }
}

export class AuthError extends AppError {
  constructor(message = "You must be signed in.") {
    super("unauthorized", message);
    this.name = "AuthError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("conflict", message);
    this.name = "ConflictError";
  }
}

export class StorageError extends AppError {
  constructor(message: string) {
    super("storage_error", message);
    this.name = "StorageError";
  }
}

export class InventoryError extends AppError {
  constructor(message: string) {
    super("inventory_error", message);
    this.name = "InventoryError";
  }
}

/** Narrow an unknown value to a Supabase PostgrestError. */
function isPostgrestError(value: unknown): value is PostgrestError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value &&
    "details" in value
  );
}

/**
 * Convert a Supabase/Postgres error into a typed AppError with a user-safe
 * message. Raw DB details never reach the client.
 */
export function fromPostgrestError(error: PostgrestError): AppError {
  switch (error.code) {
    case "23505": // unique_violation
      return new ConflictError("That value is already in use.");
    case "23503": // foreign_key_violation
      return new ValidationError("A referenced item no longer exists.");
    case "23514": // check_violation
      return new ValidationError("A value is outside its allowed range.");
    case "42501": // insufficient_privilege (RLS / guard)
      return new AppError("forbidden", "You are not allowed to do that.");
    case "PGRST116": // no rows for .single()
      return new NotFoundError();
    default:
      return new AppError("database_error", "A database error occurred.");
  }
}

/** Map any thrown value to the safe ActionError shape returned to the client. */
export function toActionError(error: unknown): ActionError {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.length ? issue.path.join(".") : "_";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return {
      code: "validation_error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      fieldErrors: error.fieldErrors,
    };
  }

  if (isPostgrestError(error)) {
    const mapped = fromPostgrestError(error);
    return { code: mapped.code, message: mapped.message };
  }

  return {
    code: "internal_error",
    message: "Something went wrong. Please try again.",
  };
}

/**
 * Wraps a mutation body so every Server Action shares one error-handling path
 * and always returns `Result<T>`. Business logic stays in the service; the
 * action just validates input and calls this.
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await fn());
  } catch (error) {
    return err(toActionError(error));
  }
}

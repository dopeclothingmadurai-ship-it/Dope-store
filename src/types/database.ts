/**
 * Supabase database types.
 *
 * This file is the single source of truth for the generated Postgres schema
 * types. From Phase 1 onward it is (re)generated with:
 *
 *   supabase gen types typescript --local > src/types/database.ts
 *
 * Until the schema exists, it declares a valid but empty `public` schema so the
 * typed Supabase clients compile under strict TypeScript with no `any`.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

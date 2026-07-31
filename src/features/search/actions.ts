"use server";

import { z } from "zod";

import { runStaffAction } from "@/lib/auth/guard";
import { type Result } from "@/lib/result";

import { globalSearch } from "./queries";
import { type SearchResults } from "./types";

const termSchema = z.object({ term: z.string().trim().max(120) });

export async function globalSearchAction(
  input: unknown,
): Promise<Result<SearchResults>> {
  return runStaffAction(async () => {
    const { term } = termSchema.parse(input);
    return globalSearch(term);
  });
}

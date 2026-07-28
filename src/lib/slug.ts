/**
 * Convert arbitrary text into a URL-safe slug that satisfies the Postgres
 * `slug` domain: `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
 *
 * Returns an empty string for input with no alphanumeric characters; callers
 * validate the result with the shared Zod slug schema.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

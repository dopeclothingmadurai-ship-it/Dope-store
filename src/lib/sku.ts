/**
 * SKU generation. Format: `DS-{PRODUCTCODE}-{COLOR}-{SIZE}-{SEQUENCE}`
 * e.g. `DS-HOOD-BLK-M-001`.
 *
 * The sequence runs per product-code + color (across sizes), matching the
 * spec examples: `DS-HOOD-BLK-M-001`, `DS-HOOD-BLK-L-002`.
 *
 * Pure and reusable — used by both the variant form (live preview) and the
 * server (authoritative, guaranteed-unique generation on create). No SKU logic
 * lives in components.
 */

export const SKU_PREFIX = "DS";

const COLOR_CODES: Record<string, string> = {
  black: "BLK",
  white: "WHT",
  grey: "GRY",
  gray: "GRY",
  khaki: "KHK",
  brown: "BRN",
  navy: "NVY",
};

function cleanUpper(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * PRODUCTCODE from the title. Titles usually lead with an adjective, so the
 * second word is used when present ("Oversized Hoodie" → HOOD, "Baggy Cargo
 * Pant" → CARG); otherwise the only word ("Hoodie" → HOOD). Max 4 chars.
 */
export function productCode(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const word = (words.length > 1 ? words[1] : words[0]) ?? "";
  return cleanUpper(word).slice(0, 4) || "GEN";
}

/** COLOR code — mapped short code, else the first three letters, else NA. */
export function colorCode(color: string | null | undefined): string {
  const value = color?.trim();
  if (!value) return "NA";
  const mapped = COLOR_CODES[value.toLowerCase()];
  if (mapped) return mapped;
  return cleanUpper(value).slice(0, 3) || "NA";
}

/** SIZE code — uppercased and stripped ("XL" → XL, "32" → 32), else OS. */
export function sizeCode(size: string | null | undefined): string {
  const value = size?.trim();
  if (!value) return "OS";
  return cleanUpper(value) || "OS";
}

/**
 * The sequence scope — `DS-{PRODUCTCODE}-{COLOR}`. All variants that share a
 * product code and color share one running sequence, regardless of size.
 */
export function sequenceScope(
  title: string,
  color: string | null | undefined,
): string {
  return `${SKU_PREFIX}-${productCode(title)}-${colorCode(color)}`;
}

/** Zero-pad a sequence number to three digits (min 001). */
export function formatSequence(sequence: number): string {
  return String(Math.max(1, Math.floor(sequence))).padStart(3, "0");
}

/**
 * The next free sequence number within a scope, given the SKUs already in use.
 * Matches `{scope}-{size}-{sequence}` and returns `max sequence + 1` (min 1).
 */
export function nextSequence(
  scope: string,
  existingSkus: Iterable<string>,
): number {
  const pattern = new RegExp(`^${escapeRegExp(scope)}-[^-]+-(\\d+)$`);
  let max = 0;
  for (const sku of existingSkus) {
    const match = pattern.exec(sku);
    if (match) {
      const value = Number.parseInt(match[1] ?? "0", 10);
      if (value > max) max = value;
    }
  }
  return max + 1;
}

/** Build a full SKU from its parts. */
export function buildSku(
  title: string,
  color: string | null | undefined,
  size: string | null | undefined,
  sequence: number,
): string {
  return `${sequenceScope(title, color)}-${sizeCode(size)}-${formatSequence(sequence)}`;
}

/** Generate the next SKU for a variant, avoiding the given existing SKUs. */
export function generateSku(
  title: string,
  color: string | null | undefined,
  size: string | null | undefined,
  existingSkus: Iterable<string>,
): string {
  const scope = sequenceScope(title, color);
  return buildSku(title, color, size, nextSequence(scope, existingSkus));
}

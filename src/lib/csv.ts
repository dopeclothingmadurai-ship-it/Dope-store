/**
 * Minimal, dependency-free CSV serialization. Values are escaped per RFC 4180:
 * any field containing a comma, quote or newline is wrapped in double quotes,
 * and embedded quotes are doubled.
 */
export type CsvValue = string | number | boolean | null | undefined;

function escapeField(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Build a CSV document (with a header row) from a matrix of values. */
export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeField).join(","));
  return lines.join("\r\n");
}

/** Paise (integer) → a plain rupee number string for spreadsheets, e.g. 1399.00. */
export function paiseToCsvAmount(paise: number | null | undefined): string {
  if (paise === null || paise === undefined) return "";
  return (paise / 100).toFixed(2);
}

import { type DateRangeKey, type ResolvedRange } from "./types";

export const RANGE_OPTIONS: { key: DateRangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "year", label: "This year" },
  { key: "custom", label: "Custom" },
];

const RANGE_LABELS: Record<DateRangeKey, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  year: "This year",
  custom: "Custom range",
};

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Resolve a range key (and optional custom bounds) into concrete [from, to)
 * timestamps plus the bucket granularity used by the charts.
 */
export function resolveRange(
  key: DateRangeKey,
  customFrom?: string | null,
  customTo?: string | null,
): ResolvedRange {
  const now = new Date();
  const tomorrow = startOfDay(addDays(now, 1));

  if (key === "custom" && customFrom) {
    const from = startOfDay(new Date(customFrom));
    const to = customTo ? startOfDay(addDays(new Date(customTo), 1)) : tomorrow;
    const spanDays = Math.round((to.getTime() - from.getTime()) / 86_400_000);
    return {
      key,
      from: from.toISOString(),
      to: to.toISOString(),
      label: RANGE_LABELS.custom,
      granularity: spanDays > 92 ? "month" : "day",
    };
  }

  if (key === "year") {
    const from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    return {
      key,
      from: from.toISOString(),
      to: tomorrow.toISOString(),
      label: RANGE_LABELS.year,
      granularity: "month",
    };
  }

  const days = key === "today" ? 1 : key === "7d" ? 7 : key === "90d" ? 90 : 30;
  const resolvedKey: DateRangeKey =
    key === "today" || key === "7d" || key === "90d" ? key : "30d";
  const from = startOfDay(addDays(now, -(days - 1)));
  return {
    key: resolvedKey,
    from: from.toISOString(),
    to: tomorrow.toISOString(),
    label: RANGE_LABELS[resolvedKey],
    granularity: "day",
  };
}

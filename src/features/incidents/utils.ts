const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "seconds" },
  { amount: 60, unit: "minutes" },
  { amount: 24, unit: "hours" },
  { amount: 7, unit: "days" },
  { amount: 4.34524, unit: "weeks" },
  { amount: 12, unit: "months" },
  { amount: Number.POSITIVE_INFINITY, unit: "years" },
];

/** e.g. "3 hours ago". Falls back gracefully for invalid input. */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown";

  let duration = (date.getTime() - now) / 1000;
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return relativeTimeFormatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return relativeTimeFormatter.format(Math.round(duration), "years");
}

/** e.g. "Aug 5, 2026, 3:42 PM". Falls back gracefully for invalid input. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return dateTimeFormatter.format(date);
}

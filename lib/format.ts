const money = new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

const moneyCents = new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 850 → "850 $" (Canadian French formatting). */
export const formatMoney = (amount: number) => money.format(amount);

/** 1.99 → "1,99 $" */
export const formatPrice = (amount: number) => moneyCents.format(amount);

/** "700 $–1 100 $" */
export const formatBudget = (min: number, max: number) => `${formatMoney(min)}–${formatMoney(max)}`;

/** "2027-05-01" → "1er mai 2027" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = d === 1 ? "1er" : String(d);
  const monthYear = new Intl.DateTimeFormat("fr-CA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return `${day} ${monthYear}`;
}

/** "23:30" → "23 h 30", "00:00" → "0 h" (Canadian French style). */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

/** Today's date as "YYYY-MM-DD" in the app timezone (America/Toronto). */
export function todayIso(timeZone = "America/Toronto"): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(),
  );
}

/** ISO date/time → "18 nov." (adds the year only when it isn't the current one). */
export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(d);
}

/** ISO timestamp → "14 h 05" (local time). */
export function formatClock(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Same calendar day (local time). */
export const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();

/** "Aujourd'hui" / "Hier" / "12 nov." for chat day separators and list timestamps. */
export function formatDayLabel(iso: string, today: string, yesterday: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return today;
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return yesterday;
  return formatShortDate(iso);
}

/** "2027-05-01" → "mai 2027" */
export function formatMonth(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-CA", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}

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

/** "2027-05-01" → "mai 2027" */
export function formatMonth(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-CA", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}

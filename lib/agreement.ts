/**
 * Roommate agreement (« Entente de colocation »): data model, smart defaults
 * taken from the roommates' profiles, and pure helpers used by the builder,
 * the printable document and the PDF.
 */
import { t } from "./strings";
import type { Profile } from "./types";

export interface Member {
  id: string;
  firstName: string;
  photo?: string;
}

export interface Agreement {
  rent: { total: number; mode: "equal" | "custom"; percents: Record<string, number> };
  utilities: { monthly: number; internet: number; mode: "equal" | "rent" };
  chores: string[];
  quiet: { weekdayFrom: string; weekdayTo: string; weekendFrom: string; weekendTo: string; examExtended: boolean };
  guests: { notice: boolean; overnightPerWeek: number; partnerRule: boolean };
  cleanliness: { level: 1 | 2 | 3 | 4 | 5; rules: string[] };
  groceries: { mode: "shared" | "separate" | "mixed"; budget: number };
  pets: "no" | "yes" | "ask";
  smoking: "no" | "outside" | "yes";
  conflictSteps: string[];
  lease: { moveIn: string; months: number };
  notes: string;
}

export interface Signature {
  name: string;
  signedAt: string;
}

const round25 = (n: number) => Math.round(n / 25) * 25;

/** Bedtime "HH:MM" → minutes after 18:00, to compare late times correctly. */
const late = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return ((h - 18 + 24) % 24) * 60 + m;
};

export function defaultAgreement(people: Profile[]): Agreement {
  const n = people.length;
  const mids = people.map((p) => (p.budget.min + p.budget.max) / 2);
  const earliestBed = people.map((p) => p.lifestyle.bedtime).sort((a, b) => late(a) - late(b))[0] ?? "23:00";
  const strictest = Math.max(...people.map((p) => p.lifestyle.cleanliness)) as Agreement["cleanliness"]["level"];
  const anyAllergic = people.some((p) => p.lifestyle.pets === "allergic");
  const nobodySmokes = people.every((p) => p.lifestyle.smoking === "no");
  const latestMoveIn = people.map((p) => p.moveIn).sort().at(-1) ?? "";

  return {
    rent: {
      total: round25(mids.reduce((s, m) => s + m, 0)),
      mode: "equal",
      percents: Object.fromEntries(people.map((p) => [p.id, Math.round(100 / n)])),
    },
    utilities: { monthly: 60 * n + 40, internet: 70, mode: "equal" },
    chores: [...t.agreement.chores.defaults],
    quiet: {
      // Quiet hours start at the earliest roommate's bedtime (but not before 22:00).
      weekdayFrom: late(earliestBed) < late("22:00") ? "22:00" : earliestBed,
      weekdayTo: "07:00",
      weekendFrom: "00:00",
      weekendTo: "09:00",
      examExtended: true,
    },
    guests: { notice: true, overnightPerWeek: 2, partnerRule: true },
    cleanliness: { level: strictest, rules: t.agreement.cleanliness.rules.slice(0, 3) },
    groceries: { mode: "mixed", budget: 150 },
    pets: anyAllergic ? "no" : "ask",
    smoking: nobodySmokes ? "no" : "outside",
    conflictSteps: [...t.agreement.conflict.defaults],
    lease: { moveIn: latestMoveIn, months: 12 },
    notes: "",
  };
}

/** Percent share per member (equal split or custom percentages). */
export function rentPercents(a: Agreement, members: Member[]): Record<string, number> {
  if (a.rent.mode === "equal") return Object.fromEntries(members.map((m) => [m.id, 100 / members.length]));
  return Object.fromEntries(members.map((m) => [m.id, a.rent.percents[m.id] ?? 0]));
}

export const percentSum = (a: Agreement, members: Member[]) =>
  Math.round(members.reduce((s, m) => s + (a.rent.percents[m.id] ?? 0), 0));

/** Monthly amounts per member: rent, utilities (+ internet), total. */
export function monthlyShares(a: Agreement, members: Member[]) {
  const pct = rentPercents(a, members);
  const services = a.utilities.monthly + a.utilities.internet;
  return members.map((m) => {
    const rent = Math.round((a.rent.total * pct[m.id]) / 100);
    const util = Math.round(a.utilities.mode === "equal" ? services / members.length : (services * pct[m.id]) / 100);
    return { member: m, percent: pct[m.id], rent, utilities: util, total: rent + util };
  });
}

/** Weekly chore rotation: chore i in week w goes to member (i + w) mod n. */
export function choreRotation(chores: string[], members: Member[], weeks = 4) {
  return chores.map((chore, i) => ({
    chore,
    weeks: Array.from({ length: weeks }, (_, w) => members[(i + w) % members.length]),
  }));
}

export const isFullySigned = (signatures: Record<string, Signature>, members: Member[]) =>
  members.every((m) => signatures[m.id]);

export function validFullName(name: string): boolean {
  const parts = name.trim().split(/\s+/).filter((p) => p.length >= 2);
  return parts.length >= 2;
}

/** Fictional last names used when a demo roommate "signs". */
const DEMO_LAST_NAMES = ["Tremblay", "Nguyen", "Singh", "Gagnon", "Okafor", "Roy", "Haddad", "Martin", "Silva", "Côté"];
export function demoFullName(member: Member): string {
  let h = 0;
  for (const c of member.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `${member.firstName} ${DEMO_LAST_NAMES[h % DEMO_LAST_NAMES.length]}`;
}

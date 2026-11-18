/**
 * Compatibility score: a simple, explainable weighted formula.
 *
 *   budget overlap 25 % · sleep schedule 20 % · cleanliness 15 %
 *   study habits 15 %   · shared interests 15 % · guests 10 %
 *
 * Each factor is 0..1. Deal-breakers (smoker vs non-smoker, pet vs allergy)
 * multiply the total by 0.8. The result is shown as a percentage, and the
 * strongest factors become the "top 3 reasons".
 */
import { formatBudget } from "./format";
import { SCHOOLS } from "./schools";
import { t } from "./strings";
import type { Profile } from "./types";

export const WEIGHTS = {
  budget: 0.25,
  sleep: 0.2,
  cleanliness: 0.15,
  study: 0.15,
  interests: 0.15,
  guests: 0.1,
} as const;

export interface Compatibility {
  score: number; // 0..100
  reasons: string[]; // top 3, French
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Minutes after 18:00, so 23:00 and 01:00 are 2 h apart (not 22 h). */
function bedtimeMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (((h - 18 + 24) % 24) * 60) + m;
}

const GUESTS = { rarely: 0, sometimes: 1, often: 2 } as const;

interface Candidate {
  text: string;
  strength: number; // for ranking reasons
}

export function computeCompatibility(me: Profile, other: Profile): Compatibility {
  const reasons: Candidate[] = [];

  // Budget: overlap relative to the narrower range; small gaps get partial credit.
  const lo = Math.max(me.budget.min, other.budget.min);
  const hi = Math.min(me.budget.max, other.budget.max);
  const narrower = Math.max(50, Math.min(me.budget.max - me.budget.min, other.budget.max - other.budget.min));
  const budget = hi >= lo ? clamp01((hi - lo) / narrower + 0.25) : clamp01(1 - (lo - hi) / 300) * 0.4;
  if (hi > lo) reasons.push({ text: t.compat.budget(formatBudget(lo, hi)), strength: budget * WEIGHTS.budget });

  // Sleep: bedtime gap (0 at 3 h apart) + chronotype match.
  const gap = Math.abs(bedtimeMinutes(me.lifestyle.bedtime) - bedtimeMinutes(other.lifestyle.bedtime));
  const sameChrono = me.study.chronotype === other.study.chronotype;
  const sleep = clamp01(1 - gap / 180) * 0.6 + (sameChrono ? 0.4 : 0);
  if (sameChrono)
    reasons.push({
      text: me.study.chronotype === "morning" ? t.compat.bothMorning : t.compat.bothNight,
      strength: sleep * WEIGHTS.sleep + 0.01,
    });
  else if (gap <= 30) reasons.push({ text: t.compat.sameBedtime, strength: sleep * WEIGHTS.sleep });

  // Cleanliness.
  const cleanDiff = Math.abs(me.lifestyle.cleanliness - other.lifestyle.cleanliness);
  const cleanliness = 1 - cleanDiff / 4;
  if (cleanDiff === 0)
    reasons.push({ text: t.compat.sameCleanliness(me.lifestyle.cleanliness), strength: WEIGHTS.cleanliness });
  else if (cleanDiff === 1) reasons.push({ text: t.compat.closeCleanliness, strength: 0.75 * WEIGHTS.cleanliness });

  // Study habits: noise matters most, then place, then exam behaviour.
  const sameNoise = me.study.noise === other.study.noise;
  const samePlace = me.study.place === other.study.place;
  const sameExam = me.study.examMode === other.study.examMode;
  const study = (sameNoise ? 0.5 : 0) + (samePlace ? 0.25 : 0) + (sameExam ? 0.25 : 0);
  if (sameNoise)
    reasons.push({
      text: me.study.noise === "quiet" ? t.compat.bothQuiet : t.compat.bothMusic,
      strength: 0.5 * WEIGHTS.study + 0.02,
    });
  if (samePlace)
    reasons.push({
      text: me.study.place === "library" ? t.compat.bothLibrary : t.compat.bothHome,
      strength: 0.25 * WEIGHTS.study,
    });
  if (sameExam) reasons.push({ text: t.compat.sameExam, strength: 0.2 * WEIGHTS.study });

  // Shared interests (case-insensitive); 3 shared = full marks.
  const mine = new Set(me.interests.map((i) => i.toLowerCase()));
  const shared = other.interests.filter((i) => mine.has(i.toLowerCase()));
  const interests = clamp01(shared.length / 3);
  if (shared.length)
    reasons.push({
      text: t.compat.interests(shared.slice(0, 3).join(", ")),
      strength: interests * WEIGHTS.interests + shared.length * 0.01,
    });

  // Guests.
  const guestDiff = Math.abs(GUESTS[me.lifestyle.guests] - GUESTS[other.lifestyle.guests]);
  const guests = 1 - guestDiff / 2;
  if (guestDiff === 0) reasons.push({ text: t.compat.sameGuests, strength: 0.6 * WEIGHTS.guests });

  // Bonus reasons (not weighted, but useful context).
  if (me.school === other.school)
    reasons.push({ text: t.compat.sameSchool(SCHOOLS[me.school].short), strength: 0.09 });
  const monthsApart = Math.abs(
    (Date.parse(me.moveIn) - Date.parse(other.moveIn)) / (1000 * 60 * 60 * 24 * 30.4),
  );
  if (monthsApart <= 1) reasons.push({ text: t.compat.sameMoveIn, strength: 0.08 });

  let total =
    budget * WEIGHTS.budget +
    sleep * WEIGHTS.sleep +
    cleanliness * WEIGHTS.cleanliness +
    study * WEIGHTS.study +
    interests * WEIGHTS.interests +
    guests * WEIGHTS.guests;

  const smokeClash =
    (me.lifestyle.smoking === "no" && other.lifestyle.smoking === "yes") ||
    (me.lifestyle.smoking === "yes" && other.lifestyle.smoking === "no");
  const petClash =
    (me.lifestyle.pets === "allergic" && other.lifestyle.pets === "has") ||
    (me.lifestyle.pets === "has" && other.lifestyle.pets === "allergic");
  if (smokeClash) total *= 0.8;
  if (petClash) total *= 0.8;

  return {
    score: Math.round(Math.max(5, Math.min(99, total * 100))),
    reasons: reasons
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3)
      .map((r) => r.text),
  };
}

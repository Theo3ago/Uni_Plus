"use client";

/**
 * Daily swipe limit: 12 free swipes per day, reset at midnight America/Toronto,
 * plus purchased extra swipes and Premium (unlimited) from the fake checkout.
 * No payment information is ever stored here — only the resulting credits.
 */
import { APP_TIMEZONE, DEMO_MODE, FREE_SWIPES_PER_DAY } from "../config";
import { todayIso } from "../format";
import { readStored, useStored, writeStored } from "../storage";
import { getSupabase } from "../supabase/client";

interface DailyUsage {
  day: string; // YYYY-MM-DD in America/Toronto
  used: number;
}

export interface Credits {
  extra: number;
  premiumUntil: string | null; // ISO timestamp
}

const USAGE_KEY = "swipe-usage";
const CREDITS_KEY = "swipe-credits";
const NO_CREDITS: Credits = { extra: 0, premiumUntil: null };
const NO_USAGE: DailyUsage = { day: "", used: 0 };

const isPremium = (c: Credits) => Boolean(c.premiumUntil && Date.parse(c.premiumUntil) > Date.now());
const usedToday = (u: DailyUsage) => (u.day === todayIso(APP_TIMEZONE) ? u.used : 0);

export function useSwipeQuota() {
  const [usage] = useStored<DailyUsage>(USAGE_KEY, NO_USAGE);
  const [credits] = useStored<Credits>(CREDITS_KEY, NO_CREDITS);
  const unlimited = isPremium(credits);
  const freeLeft = Math.max(0, FREE_SWIPES_PER_DAY - usedToday(usage));
  return { unlimited, remaining: freeLeft + credits.extra, freeLeft, extra: credits.extra };
}

/** Uses one swipe. Returns false (and changes nothing) when none are left. */
export function consumeSwipe(): boolean {
  const credits = readStored<Credits>(CREDITS_KEY, NO_CREDITS);
  if (isPremium(credits)) return true;
  const usage = readStored<DailyUsage>(USAGE_KEY, NO_USAGE);
  const today = todayIso(APP_TIMEZONE);
  const used = usage.day === today ? usage.used : 0;
  if (used < FREE_SWIPES_PER_DAY) {
    writeStored(USAGE_KEY, { day: today, used: used + 1 });
    return true;
  }
  if (credits.extra > 0) {
    saveCredits({ ...credits, extra: credits.extra - 1 });
    return true;
  }
  return false;
}

export function hasSwipeLeft(): boolean {
  const credits = readStored<Credits>(CREDITS_KEY, NO_CREDITS);
  if (isPremium(credits) || credits.extra > 0) return true;
  return usedToday(readStored<DailyUsage>(USAGE_KEY, NO_USAGE)) < FREE_SWIPES_PER_DAY;
}

export function addSwipeCredits(n: number) {
  const c = readStored<Credits>(CREDITS_KEY, NO_CREDITS);
  saveCredits({ ...c, extra: c.extra + n });
}

export function activatePremium(days = 30) {
  const c = readStored<Credits>(CREDITS_KEY, NO_CREDITS);
  saveCredits({ ...c, premiumUntil: new Date(Date.now() + days * 864e5).toISOString() });
}

function saveCredits(c: Credits) {
  writeStored(CREDITS_KEY, c);
  if (DEMO_MODE) return;
  // Best effort: mirror credits to Supabase so they follow the account.
  const sb = getSupabase()!;
  void sb.auth.getSession().then(({ data }) => {
    const uid = data.session?.user.id;
    // .then() is required: Supabase query builders are lazy.
    if (uid)
      void sb
        .from("swipe_credits")
        .upsert({ user_id: uid, extra_swipes: c.extra, premium_until: c.premiumUntil })
        .then(() => undefined);
  });
}

/** Milliseconds until the next midnight in America/Toronto. */
export function msUntilReset(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const elapsed = (get("hour") * 3600 + get("minute") * 60 + get("second")) * 1000;
  return 24 * 3600 * 1000 - elapsed;
}

/** "5 h 12" */
export function formatCountdown(ms: number): string {
  const totalMin = Math.max(1, Math.ceil(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}

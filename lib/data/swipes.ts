"use client";

/**
 * Swipes, matches and Discover filters.
 * The UI always reads from the local store (instant + offline-proof). In Supabase
 * mode, writes also go to the database and `syncFromServer` refreshes the cache.
 */
import { BUDGET_RANGE, DEMO_MODE } from "../config";
import { getDemoProfile } from "../demo/profiles";
import { readStored, useStored, writeStored } from "../storage";
import { getSupabase } from "../supabase/client";
import type { Profile, SchoolId } from "../types";
import { fromRow } from "./profiles";

export type Decision = "like" | "pass";

export interface Match {
  id: string;
  profile: Profile;
  createdAt: string;
}

const SWIPES_KEY = "swipes";
const MATCHES_KEY = "matches";
const FILTERS_KEY = "filters";

export const useSwipes = () => useStored<Record<string, Decision>>(SWIPES_KEY, {});
export const useMatches = () => useStored<Match[]>(MATCHES_KEY, []);

export function getMatch(id: string): Match | undefined {
  return readStored<Match[]>(MATCHES_KEY, []).find((m) => m.id === id);
}

function addMatchLocally(match: Match) {
  const all = readStored<Match[]>(MATCHES_KEY, []);
  if (!all.some((m) => m.id === match.id)) writeStored(MATCHES_KEY, [match, ...all]);
}

/** Records a swipe. Returns the new Match when the like is mutual. */
export async function recordSwipe(profile: Profile, liked: boolean): Promise<Match | null> {
  writeStored(SWIPES_KEY, { ...readStored(SWIPES_KEY, {}), [profile.id]: liked ? "like" : "pass" });
  if (!liked) {
    if (!DEMO_MODE) void getSupabase()!.from("swipes").upsert({ swiper_id: await myId(), target_id: profile.id, liked });
    return null;
  }

  if (DEMO_MODE) {
    if (!getDemoProfile(profile.id)?.demo.likesYou) return null;
    const match: Match = { id: `match-${profile.id}`, profile, createdAt: new Date().toISOString() };
    addMatchLocally(match);
    return match;
  }

  const sb = getSupabase()!;
  const me = await myId();
  const { error } = await sb.from("swipes").upsert({ swiper_id: me, target_id: profile.id, liked: true });
  if (error) return null;
  // The database trigger creates the match row when the like is mutual.
  const [a, b] = [me, profile.id].sort();
  const { data } = await sb.from("matches").select("id, created_at").eq("user_a", a).eq("user_b", b).maybeSingle();
  if (!data) return null;
  const match: Match = { id: data.id, profile, createdAt: data.created_at };
  addMatchLocally(match);
  return match;
}

async function myId(): Promise<string> {
  const { data } = await getSupabase()!.auth.getSession();
  return data.session?.user.id ?? "";
}

/** Supabase only: pull my swipes and matches into the local cache. */
export async function syncFromServer(): Promise<void> {
  if (DEMO_MODE) return;
  const sb = getSupabase()!;
  const me = await myId();
  if (!me) return;

  const { data: swipes } = await sb.from("swipes").select("target_id, liked").eq("swiper_id", me);
  if (swipes)
    writeStored(
      SWIPES_KEY,
      Object.fromEntries(swipes.map((s) => [s.target_id, s.liked ? "like" : "pass"])) as Record<string, Decision>,
    );

  const { data: rows } = await sb.from("matches").select("id, user_a, user_b, created_at").order("created_at", {
    ascending: false,
  });
  if (!rows?.length) return writeStored(MATCHES_KEY, []);
  const otherIds = rows.map((r) => (r.user_a === me ? r.user_b : r.user_a));
  const { data: profiles } = await sb.from("profiles").select("*").in("id", otherIds);
  const byId = new Map((profiles ?? []).map((p) => [p.id, fromRow(p)]));
  writeStored(
    MATCHES_KEY,
    rows.flatMap((r, i) => {
      const profile = byId.get(otherIds[i]);
      return profile ? [{ id: r.id, profile, createdAt: r.created_at }] : [];
    }),
  );
}

/** Demo only: forget passes so passed profiles come back into the deck. */
export function clearPasses() {
  const swipes = readStored<Record<string, Decision>>(SWIPES_KEY, {});
  writeStored(SWIPES_KEY, Object.fromEntries(Object.entries(swipes).filter(([, d]) => d === "like")));
}

// ── Filters ──────────────────────────────────────────────────────────────────

export interface Filters {
  schools: SchoolId[]; // empty = all
  budget: [number, number];
  moveInWithinMonths: 0 | 1 | 3 | 6; // 0 = any
}

export const DEFAULT_FILTERS: Filters = {
  schools: [],
  budget: [BUDGET_RANGE.min, BUDGET_RANGE.max],
  moveInWithinMonths: 0,
};

export const useFilters = () => useStored<Filters>(FILTERS_KEY, DEFAULT_FILTERS);

export function activeFilterCount(f: Filters): number {
  return (
    (f.schools.length ? 1 : 0) +
    (f.budget[0] !== DEFAULT_FILTERS.budget[0] || f.budget[1] !== DEFAULT_FILTERS.budget[1] ? 1 : 0) +
    (f.moveInWithinMonths ? 1 : 0)
  );
}

export function applyFilters(profiles: Profile[], f: Filters, me: Profile): Profile[] {
  const myMove = Date.parse(me.moveIn);
  return profiles.filter((p) => {
    if (f.schools.length && !f.schools.includes(p.school)) return false;
    if (p.budget.max < f.budget[0] || p.budget.min > f.budget[1]) return false;
    if (f.moveInWithinMonths) {
      const months = Math.abs(Date.parse(p.moveIn) - myMove) / (1000 * 60 * 60 * 24 * 30.4);
      if (months > f.moveInWithinMonths + 0.1) return false;
    }
    return true;
  });
}

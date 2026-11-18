"use client";

/**
 * Profile data access. Every screen goes through these functions, so switching
 * between demo mode (localStorage + seeded profiles) and Supabase is invisible to the UI.
 */
import { DEMO_MODE } from "../config";
import { DEMO_PROFILES } from "../demo/profiles";
import { readStored, useStored, writeStored } from "../storage";
import { getSupabase } from "../supabase/client";
import type { Profile } from "../types";

export const ME_KEY = "me";

// ── Row mapping (Supabase snake_case ↔ app camelCase) ─────────────────────────
interface ProfileRow {
  id: string;
  first_name: string;
  age: number;
  program: string;
  year: number;
  school: string;
  bio: string;
  photos: string[];
  interests: string[];
  study: Profile["study"];
  lifestyle: Profile["lifestyle"];
  budget_min: number;
  budget_max: number;
  move_in: string;
}

export const fromRow = (r: ProfileRow): Profile => ({
  id: r.id,
  firstName: r.first_name,
  age: r.age,
  program: r.program,
  year: r.year as Profile["year"],
  school: r.school as Profile["school"],
  bio: r.bio ?? "",
  photos: r.photos ?? [],
  interests: r.interests ?? [],
  study: r.study,
  lifestyle: r.lifestyle,
  budget: { min: r.budget_min, max: r.budget_max },
  moveIn: r.move_in,
});

export const toRow = (p: Profile): ProfileRow => ({
  id: p.id,
  first_name: p.firstName,
  age: p.age,
  program: p.program,
  year: p.year,
  school: p.school,
  bio: p.bio,
  photos: p.photos,
  interests: p.interests,
  study: p.study,
  lifestyle: p.lifestyle,
  budget_min: p.budget.min,
  budget_max: p.budget.max,
  move_in: p.moveIn,
});

// ── API ──────────────────────────────────────────────────────────────────────

export async function getMyProfile(): Promise<Profile | null> {
  if (DEMO_MODE) return readStored<Profile | null>(ME_KEY, null);
  const sb = getSupabase()!;
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data } = await sb.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
  return data ? fromRow(data as ProfileRow) : null;
}

export async function saveMyProfile(p: Profile): Promise<void> {
  writeStored(ME_KEY, p); // local copy keeps the UI instant in both modes
  if (DEMO_MODE) return;
  const sb = getSupabase()!;
  const { error } = await sb.from("profiles").upsert(toRow(p));
  if (error) throw error;
}

/** Everyone except me. Swipe filtering happens in the Discover feature. */
export async function listCandidates(): Promise<Profile[]> {
  if (DEMO_MODE) return DEMO_PROFILES;
  const sb = getSupabase()!;
  const { data: auth } = await sb.auth.getUser();
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .neq("id", auth.user?.id ?? "")
    .limit(200);
  if (error) throw error;
  return (data as ProfileRow[]).map(fromRow);
}

/** Reactive local copy of my profile (instant, works offline). */
export function useMyProfile() {
  return useStored<Profile | null>(ME_KEY, null);
}

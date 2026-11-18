"use client";

/**
 * Profile data access. Every screen goes through these functions, so switching
 * between demo mode (localStorage + seeded profiles) and Supabase is invisible to the UI.
 */
import { DEMO_MODE } from "../config";
import { DEMO_PROFILES } from "../demo/profiles";
import { dataUrlToBlob } from "../image";
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

/** Uploads any new (data: URL) photos to Supabase Storage and returns public URLs. */
async function persistPhotos(uid: string, photos: string[]): Promise<string[]> {
  const sb = getSupabase()!;
  return Promise.all(
    photos.map(async (src) => {
      if (!src.startsWith("data:")) return src; // already uploaded
      const blob = await dataUrlToBlob(src);
      const path = `${uid}/${crypto.randomUUID()}.jpg`;
      const { error } = await sb.storage.from("photos").upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      return sb.storage.from("photos").getPublicUrl(path).data.publicUrl;
    }),
  );
}

export async function saveMyProfile(p: Profile): Promise<Profile> {
  if (DEMO_MODE) {
    const saved = { ...p, id: "me" };
    writeStored(ME_KEY, saved);
    return saved;
  }
  const sb = getSupabase()!;
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error("not signed in");
  const saved: Profile = { ...p, id: auth.user.id, photos: await persistPhotos(auth.user.id, p.photos) };
  const { error } = await sb.from("profiles").upsert({ ...toRow(saved), updated_at: new Date().toISOString() });
  if (error) throw error;
  writeStored(ME_KEY, saved); // local copy keeps the UI instant
  return saved;
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

"use client";

import { DEMO_MODE } from "../config";
import { clearAllStored } from "../storage";
import { getSupabase } from "../supabase/client";

export const DEMO_USER_ID = "me";

/** Current user id: "me" in demo mode, the Supabase auth uid otherwise (null if signed out). */
export async function getUserId(): Promise<string | null> {
  if (DEMO_MODE) return DEMO_USER_ID;
  const { data } = await getSupabase()!.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function sendMagicLink(email: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw error;
}

/** Signs out (Supabase) or wipes all demo data (demo mode). */
export async function signOut(): Promise<void> {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
  clearAllStored();
}

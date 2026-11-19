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

export type PasswordResult = "signed-in" | "confirm-email";

/**
 * Email + password. Recommended for a class: with « Confirm email » turned off in
 * Supabase, no email is sent at all (the built-in sender allows only 2 emails/hour).
 */
export async function passwordAuth(mode: "signin" | "signup", email: string, password: string): Promise<PasswordResult> {
  const sb = getSupabase();
  if (!sb) return "signed-in";
  if (mode === "signin") {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return "signed-in";
  }
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw error;
  // Supabase returns a fake user with no identities when the email is already registered.
  if (data.user && data.user.identities?.length === 0) throw Object.assign(new Error("exists"), { code: "user_already_exists" });
  return data.session ? "signed-in" : "confirm-email";
}

/** Signs out (Supabase) or wipes all demo data (demo mode). */
export async function signOut(): Promise<void> {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
  clearAllStored();
}

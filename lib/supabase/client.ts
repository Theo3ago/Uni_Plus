import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO_MODE, SUPABASE_ANON_KEY, SUPABASE_URL } from "../config";

let client: SupabaseClient | null = null;

/** Browser Supabase client, or null in demo mode (nothing ever touches the network then). */
export function getSupabase(): SupabaseClient | null {
  if (DEMO_MODE) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return client;
}

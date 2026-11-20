/**
 * Runtime configuration.
 *
 * The Supabase project URL and publishable key are written here directly so the
 * deployed site works without any Vercel environment variables. Both values are
 * public by design (they ship to every browser); access is controlled by the
 * Row Level Security policies in supabase/schema.sql. Never put a secret key here.
 *
 * Environment variables, when set, still take precedence:
 * - NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY: another Supabase project
 * - NEXT_PUBLIC_DEMO_MODE="true": force demo mode (no backend, seeded profiles)
 * Demo mode is also forced on if the Supabase values are empty.
 */
const DEFAULT_SUPABASE_URL = "https://bqmjgcpnyjsebxjrgkts.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2rjM0wTJiz0EoVx-gThPGQ_NZG9cocd";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export const HAS_SUPABASE = Boolean(supabaseUrl && supabaseAnonKey);

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !HAS_SUPABASE;

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
export const HAS_MAPS_KEY = Boolean(GOOGLE_MAPS_API_KEY);

export const JITSI_DOMAIN = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si";

/** Free swipes per day (resets at midnight, America/Toronto). */
export const FREE_SWIPES_PER_DAY = 12;
export const APP_TIMEZONE = "America/Toronto";

/** Monthly rent per person (CAD) range used by sliders and filters. */
export const BUDGET_RANGE = { min: 400, max: 2000, step: 25 };

/**
 * Runtime configuration, read from public environment variables.
 *
 * Demo mode is ON unless NEXT_PUBLIC_DEMO_MODE is explicitly "false".
 * It is also forced on when the Supabase keys are missing, so the app can never
 * end up half-configured during a live presentation.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const HAS_SUPABASE = Boolean(supabaseUrl && supabaseAnonKey);

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false" || !HAS_SUPABASE;

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

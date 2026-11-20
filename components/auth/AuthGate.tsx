"use client";

/**
 * Protects app screens.
 * - Demo mode: needs a local profile, otherwise → /bienvenue (onboarding).
 * - Supabase: needs a session (→ /connexion) and a profile (→ /bienvenue).
 */
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Spinner } from "@/components/ui/States";
import { DEMO_MODE } from "@/lib/config";
import { getUserId } from "@/lib/data/auth";
import { getMyProfile, ME_KEY, useMyProfile } from "@/lib/data/profiles";
import { clearAllStored, readStored, removeStored, useHydrated, writeStored } from "@/lib/storage";
import type { Profile } from "@/lib/types";

/** Which Supabase user the browser cache belongs to. */
const OWNER_KEY = "owner";

export function FullScreenSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function AuthGate({ children, requireProfile = true }: { children: ReactNode; requireProfile?: boolean }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [me] = useMyProfile();
  const [remoteReady, setRemoteReady] = useState(DEMO_MODE);

  // Supabase: verify the session and fetch the profile once.
  useEffect(() => {
    if (DEMO_MODE) return;
    let alive = true;
    (async () => {
      const uid = await getUserId();
      if (!alive) return;
      if (!uid) return router.replace("/connexion");

      // The browser cache must belong to the signed-in account. It may hold data from
      // demo mode (same website address) or from another account: start clean.
      if (readStored<string | null>(OWNER_KEY, null) !== uid) {
        clearAllStored();
        writeStored(OWNER_KEY, uid);
      }

      let profile: Profile | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          profile = await getMyProfile();
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 800));
        }
      }
      if (!alive) return;
      if (profile) writeStored(ME_KEY, profile);
      else {
        removeStored(ME_KEY);
        if (requireProfile) return router.replace("/bienvenue");
      }
      setRemoteReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [router, requireProfile]);

  const needsOnboarding = DEMO_MODE && hydrated && requireProfile && !me;
  useEffect(() => {
    if (needsOnboarding) router.replace("/bienvenue");
  }, [needsOnboarding, router]);

  if (!hydrated || !remoteReady || needsOnboarding) return <FullScreenSpinner />;
  return <>{children}</>;
}

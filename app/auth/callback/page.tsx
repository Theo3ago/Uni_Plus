"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";
import { getMyProfile } from "@/lib/data/profiles";
import { getSupabase } from "@/lib/supabase/client";
import { t } from "@/lib/strings";

/** Landing page for the email magic link. supabase-js reads the token from the URL. */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return router.replace("/bienvenue");
    let done = false;

    const route = async () => {
      if (done) return;
      done = true;
      const profile = await getMyProfile().catch(() => null);
      router.replace(profile ? "/decouvrir" : "/bienvenue");
    };

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (session) void route();
    });
    sb.auth.getSession().then(({ data }) => {
      if (data.session) void route();
    });
    const timeout = setTimeout(() => !done && setFailed(true), 8000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      {failed ? (
        <>
          <p className="text-[15px] text-ink-2">{t.auth.callbackError}</p>
          <ButtonLink href="/connexion">{t.auth.retry}</ButtonLink>
        </>
      ) : (
        <>
          <Spinner className="h-8 w-8" />
          <p className="text-[15px] text-ink-2">{t.auth.verifying}</p>
        </>
      )}
    </main>
  );
}

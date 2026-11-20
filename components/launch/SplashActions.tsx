"use client";

import { ArrowRight } from "lucide-react";
import { Countdown } from "@/components/launch/Countdown";
import { ButtonLink } from "@/components/ui/Button";
import { DEMO_MODE } from "@/lib/config";
import { relock, useLaunch } from "@/lib/launch";
import { t } from "@/lib/strings";

/** Splash buttons, replaced by the launch countdown until sign-ups open. */
export function SplashActions() {
  const launch = useLaunch();
  // Same height as the buttons while the time is checked, so nothing jumps.
  if (!launch.ready) return <div className="h-[116px]" aria-hidden />;
  if (launch.locked) return <Countdown remainingMs={launch.remainingMs} />;

  return (
    <>
      {/* Demo mode skips sign-in. "J'ai déjà un compte" lands in the app (or onboarding if no profile yet). */}
      <ButtonLink href={DEMO_MODE ? "/bienvenue" : "/connexion"} className="h-14 w-full text-base">
        {t.splash.start}
        <ArrowRight className="h-5 w-5" aria-hidden />
      </ButtonLink>
      <ButtonLink href={DEMO_MODE ? "/decouvrir" : "/connexion"} variant="ghost" className="h-12 w-full">
        {t.splash.haveAccount}
      </ButtonLink>
      {launch.bypassed ? (
        <button type="button" onClick={relock} className="mx-auto min-h-11 px-3 text-[13px] text-ink-2 underline underline-offset-2">
          {t.launch.relock}
        </button>
      ) : null}
    </>
  );
}

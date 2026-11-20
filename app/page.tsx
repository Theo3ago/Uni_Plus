import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { DemoBadge } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { DEMO_MODE } from "@/lib/config";
import { t } from "@/lib/strings";

export default function SplashPage() {
  return (
    <main className="flex flex-1 flex-col px-6 pb-10 pt-6">
      <div className="flex justify-end">
        <DemoBadge />
      </div>

      <section className="flex flex-1 flex-col items-center justify-center text-center">
        <Logo size="lg" />
        <h1 className="mt-10 max-w-[18ch] text-[34px] leading-[1.1] text-navy">{t.app.slogan}</h1>
        <p className="mt-4 max-w-[30ch] text-[16px] leading-relaxed text-ink-2">{t.app.tagline}</p>
        <p className="mt-6 text-[13px] font-medium uppercase tracking-wider text-ink-2">{t.splash.schoolsLine}</p>
      </section>

      <div className="flex flex-col gap-3">
        {/* Demo mode skips sign-in. "J'ai déjà un compte" lands in the app (or onboarding if no profile yet). */}
        <ButtonLink href={DEMO_MODE ? "/bienvenue" : "/connexion"} className="h-14 w-full text-base">
          {t.splash.start}
          <ArrowRight className="h-5 w-5" aria-hidden />
        </ButtonLink>
        <ButtonLink href={DEMO_MODE ? "/decouvrir" : "/connexion"} variant="ghost" className="h-12 w-full">
          {t.splash.haveAccount}
        </ButtonLink>
        <p className="mt-1 text-center text-xs leading-relaxed text-ink-2">
          {t.legal.splashNotice}
          <Link href="/conditions" className="font-medium text-navy underline underline-offset-2">
            {t.legal.splashLink}
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

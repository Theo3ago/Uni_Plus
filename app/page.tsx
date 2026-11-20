import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { DemoBadge } from "@/components/layout/PageHeader";
import { SplashActions } from "@/components/launch/SplashActions";
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
        <SplashActions />
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

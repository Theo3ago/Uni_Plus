"use client";

import { ArrowLeft, Check, Clock, Crown, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { SwipeCounter } from "@/components/discover/SwipeCounter";
import { ButtonLink } from "@/components/ui/Button";
import { formatCountdown, msUntilReset, useSwipeQuota } from "@/lib/data/quota";
import { formatPrice } from "@/lib/format";
import { PACKS } from "@/lib/packs";
import { t } from "@/lib/strings";

const p = t.paywall;

/** Paywall: shown when the daily swipes run out (or from the counter). */
export default function PacksPage() {
  return (
    <main className="flex flex-1 flex-col">
      <AuthGate>
        <Packs />
      </AuthGate>
    </main>
  );
}

function useCountdown() {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setMs(msUntilReset());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return ms;
}

function Packs() {
  const router = useRouter();
  const { remaining, unlimited } = useSwipeQuota();
  const ms = useCountdown();
  const empty = !unlimited && remaining === 0;

  return (
    <div className="flex flex-1 flex-col px-5 pb-10">
      <div className="flex min-h-16 items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t.common.back}
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-navy hover:bg-navy-50"
        >
          <ArrowLeft className="h-6 w-6" aria-hidden />
        </button>
        <SwipeCounter />
      </div>

      <div className="mt-2 flex h-16 w-16 items-center justify-center rounded-3xl bg-card shadow-soft">
        <Zap className="h-7 w-7 text-orange" strokeWidth={1.75} aria-hidden />
      </div>
      <h1 className="mt-5 text-[28px] leading-tight text-navy">{empty ? p.title : p.titleMore}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{empty ? p.body : p.bodyMore}</p>
      {ms !== null ? (
        <p className="mt-4 inline-flex items-center gap-2 self-start rounded-full bg-card px-3 py-1.5 text-sm font-medium text-navy shadow-soft">
          <Clock className="h-4 w-4" aria-hidden />
          {p.resetIn(formatCountdown(ms))}
        </p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {PACKS.map((pack) => (
          <li key={pack.id}>
            <Link
              href={`/paiement?forfait=${pack.id}`}
              className={`relative flex min-h-20 items-center gap-4 rounded-[20px] border bg-card p-4 shadow-soft transition-colors hover:bg-navy-50 ${
                pack.premium ? "border-navy" : "border-line"
              }`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  pack.premium ? "bg-navy text-white" : "bg-orange-50 text-navy"
                }`}
              >
                {pack.premium ? <Crown className="h-6 w-6" aria-hidden /> : <Zap className="h-6 w-6" aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold text-navy">{pack.name}</span>
                  {pack.popular ? (
                    <span className="rounded-full bg-orange px-2 py-0.5 text-[11px] font-medium text-navy">
                      {p.popular}
                    </span>
                  ) : null}
                </span>
                <span className="block text-sm text-ink-2">{pack.detail}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-display text-lg font-bold text-navy">{formatPrice(pack.price)}</span>
                {pack.premium ? <span className="block text-[13px] text-ink-2">{t.packs.premium.perMonth}</span> : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-5 flex items-center justify-center gap-2 text-center text-[13px] text-ink-2">
        <Check className="h-4 w-4" aria-hidden />
        {p.note}
      </p>
      <div className="mt-auto pt-6">
        <ButtonLink href="/decouvrir" variant="ghost" className="w-full">
          {p.later}
        </ButtonLink>
      </div>
    </div>
  );
}

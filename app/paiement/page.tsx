"use client";

/**
 * FAKE CHECKOUT — demo only.
 *
 * Safety rules (do not change):
 * - No payment provider, no network request, no fetch/XHR of any kind.
 * - Card values live only in React state on this page. They are never written to
 *   localStorage, Supabase, cookies, the URL or the console, and inputs have no
 *   `name` attribute (so nothing can be serialised by a form submit).
 * - On submit the values are validated locally for format, then immediately discarded.
 * - Only the resulting credits (swipes / Premium) are saved.
 */
import { ArrowLeft, CheckCircle2, CreditCard, Lock, TriangleAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useId, useRef, useState } from "react";
import { AuthGate, FullScreenSpinner } from "@/components/auth/AuthGate";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/States";
import { inputClass } from "@/components/ui/Form";
import { activatePremium, addSwipeCredits } from "@/lib/data/quota";
import { formatPrice } from "@/lib/format";
import { getPack, type Pack } from "@/lib/packs";
import { t } from "@/lib/strings";

const c = t.checkout;
const TEST_CARD = "4242 4242 4242 4242";

export default function CheckoutPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Permanent, always-visible demo banner. */}
      <div
        role="note"
        className="sticky top-0 z-30 flex min-h-11 items-center justify-center gap-2 bg-orange px-4 py-2 text-center text-[13px] font-medium uppercase tracking-wide text-navy"
      >
        <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
        {c.banner}
      </div>
      <AuthGate>
        <Suspense fallback={<FullScreenSpinner />}>
          <Checkout />
        </Suspense>
      </AuthGate>
    </main>
  );
}

// ── Local format checks only ──────────────────────────────────────────────────
const digits = (s: string) => s.replace(/\D/g, "");

function luhn(num: string): boolean {
  let sum = 0;
  for (let i = 0; i < num.length; i++) {
    let d = Number(num[num.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

function validExpiry(v: string): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

function defaultExpiry(): string {
  const d = new Date();
  return `12/${String((d.getFullYear() + 3) % 100).padStart(2, "0")}`;
}

const formatCardNumber = (v: string) =>
  digits(v)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

function formatExpiryInput(v: string): string {
  const d = digits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

// ──────────────────────────────────────────────────────────────────────────────

function Checkout() {
  const params = useSearchParams();
  const pack = getPack(params.get("forfait"));
  if (!pack) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-[15px] text-ink-2">{c.unknownPack}</p>
        <ButtonLink href="/forfaits">{t.common.back}</ButtonLink>
      </div>
    );
  }
  return <CheckoutForm pack={pack} />;
}

function CheckoutForm({ pack }: { pack: Pack }) {
  const router = useRouter();
  const ids = { number: useId(), expiry: useId(), cvc: useId() };
  const [number, setNumber] = useState(TEST_CARD);
  const [expiry, setExpiry] = useState(defaultExpiry);
  const [cvc, setCvc] = useState("123");
  const [errors, setErrors] = useState<{ number?: string; expiry?: string; cvc?: string }>({});
  const [stage, setStage] = useState<"form" | "processing" | "success">("form");
  const credited = useRef(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    const n = digits(number);
    if (n.length !== 16 || !luhn(n)) next.number = c.errors.number;
    if (!validExpiry(expiry)) next.expiry = c.errors.expiry;
    if (!/^\d{3,4}$/.test(cvc)) next.cvc = c.errors.cvc;
    setErrors(next);
    if (Object.keys(next).length) return;

    // Discard the card values right away — they are never used for anything.
    setNumber("");
    setExpiry("");
    setCvc("");
    setStage("processing");

    // Simulated processing delay, then credit the pack (once).
    setTimeout(() => {
      if (!credited.current) {
        credited.current = true;
        if (pack.premium) activatePremium(30);
        else addSwipeCredits(pack.swipes ?? 0);
      }
      setStage("success");
    }, 1800);
  }

  if (stage === "processing") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center" aria-live="polite">
        <Spinner className="h-10 w-10" label={c.processing} />
        <p className="text-[15px] text-ink-2">{c.processing}</p>
      </div>
    );
  }

  if (stage === "success") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center" aria-live="polite">
        <CheckCircle2 className="h-16 w-16 text-navy" strokeWidth={1.5} aria-hidden />
        <h1 className="mt-5 text-[28px] text-navy">{c.successTitle}</h1>
        <p className="mt-2 max-w-[30ch] text-[15px] leading-relaxed text-ink-2">
          {pack.premium ? c.successPremium : c.successSwipes(pack.swipes ?? 0)}
        </p>
        <ButtonLink href="/decouvrir" className="mt-8 h-14 w-full text-base">
          {c.backToDiscover}
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-5 pb-10">
      <div className="flex min-h-16 items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t.common.back}
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-navy hover:bg-navy-50"
        >
          <ArrowLeft className="h-6 w-6" aria-hidden />
        </button>
        <h1 className="text-2xl text-navy">{c.title}</h1>
      </div>

      <section className="rounded-[20px] bg-card p-5 shadow-soft" aria-label={c.summary}>
        <p className="text-[13px] font-medium uppercase tracking-wide text-ink-2">{c.summary}</p>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <div>
            <p className="font-display text-xl font-bold text-navy">{pack.name}</p>
            <p className="text-sm text-ink-2">{pack.detail}</p>
          </div>
          <p className="font-display text-xl font-bold text-navy">{formatPrice(pack.price)}</p>
        </div>
        <div className="mt-4 flex justify-between border-t border-line pt-3 text-[15px]">
          <span className="text-ink-2">{c.total}</span>
          <span className="font-medium text-navy">
            {formatPrice(pack.price)}
            {pack.premium ? ` ${t.packs.premium.perMonth}` : ""}
          </span>
        </div>
      </section>

      {/* No action, no method, no input names: nothing can leave this page. */}
      <form onSubmit={submit} noValidate autoComplete="off" className="mt-6 space-y-4">
        <p className="flex items-start gap-2 rounded-2xl bg-navy-50 p-3 text-[13px] leading-relaxed text-navy">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {c.testCardNote}
        </p>

        <div>
          <label htmlFor={ids.number} className="mb-2 block text-sm font-medium text-navy">
            {c.cardNumber}
          </label>
          <div className="relative">
            <input
              id={ids.number}
              inputMode="numeric"
              autoComplete="off"
              data-lpignore="true"
              value={number}
              onChange={(e) => setNumber(formatCardNumber(e.target.value))}
              aria-invalid={Boolean(errors.number)}
              aria-describedby={errors.number ? `${ids.number}-err` : undefined}
              className={`${inputClass} pr-12 tabular-nums tracking-wide`}
            />
            <CreditCard className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-2" aria-hidden />
          </div>
          {errors.number ? (
            <p id={`${ids.number}-err`} className="mt-1.5 text-sm font-medium text-navy">
              {errors.number}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={ids.expiry} className="mb-2 block text-sm font-medium text-navy">
              {c.expiry}
            </label>
            <input
              id={ids.expiry}
              inputMode="numeric"
              autoComplete="off"
              placeholder="MM/AA"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiryInput(e.target.value))}
              aria-invalid={Boolean(errors.expiry)}
              aria-describedby={errors.expiry ? `${ids.expiry}-err` : undefined}
              className={`${inputClass} tabular-nums`}
            />
            {errors.expiry ? (
              <p id={`${ids.expiry}-err`} className="mt-1.5 text-sm font-medium text-navy">
                {errors.expiry}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor={ids.cvc} className="mb-2 block text-sm font-medium text-navy">
              {c.cvc}
            </label>
            <input
              id={ids.cvc}
              inputMode="numeric"
              autoComplete="off"
              value={cvc}
              onChange={(e) => setCvc(digits(e.target.value).slice(0, 4))}
              aria-invalid={Boolean(errors.cvc)}
              aria-describedby={errors.cvc ? `${ids.cvc}-err` : undefined}
              className={`${inputClass} tabular-nums`}
            />
            {errors.cvc ? (
              <p id={`${ids.cvc}-err`} className="mt-1.5 text-sm font-medium text-navy">
                {errors.cvc}
              </p>
            ) : null}
          </div>
        </div>

        <Button type="submit" className="mt-2 h-14 w-full text-base">
          <Lock className="h-4 w-4" aria-hidden />
          {c.pay(formatPrice(pack.price))}
        </Button>
      </form>
    </div>
  );
}

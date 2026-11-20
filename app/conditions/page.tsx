"use client";

/**
 * Terms of use + privacy policy. Public page (no sign-in needed), linked from the
 * splash screen, the sign-up form and the Profil tab.
 */
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { CONTACT_EMAIL, TERMS_VERSION } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { t } from "@/lib/strings";

const L = t.legal;
const contact = CONTACT_EMAIL ? L.contactEmail(CONTACT_EMAIL) : L.contactFallback;
const fill = (s: string) => s.replaceAll("{contact}", contact);

function Sections({ items }: { items: readonly { h: string; p: readonly string[] }[] }) {
  return (
    <div className="space-y-5">
      {items.map((s) => (
        <section key={s.h}>
          <h3 className="text-[17px] text-navy">{s.h}</h3>
          {s.p.map((para) => (
            <p key={para} className="mt-1.5 text-[15px] leading-relaxed text-ink-2">
              {fill(para)}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}

export default function TermsPage() {
  const router = useRouter();
  const back = () => (window.history.length > 1 ? router.back() : router.push("/"));

  return (
    <main className="flex flex-1 flex-col px-5 pb-12 pt-3">
      <button
        type="button"
        onClick={back}
        aria-label={t.common.back}
        className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-navy hover:bg-navy-50"
      >
        <ArrowLeft className="h-6 w-6" aria-hidden />
      </button>
      <div className="mt-4">
        <Logo />
      </div>
      <h1 className="mt-6 text-[28px] leading-tight text-navy">{L.title}</h1>
      <p className="mt-1 text-sm text-ink-2">{L.updated(formatDate(TERMS_VERSION))}</p>

      <section className="mt-6 rounded-[24px] bg-card p-5 shadow-soft">
        <h2 className="text-xl text-navy">{L.summaryTitle}</h2>
        <ul className="mt-3 space-y-2.5">
          {L.summary.map((line) => (
            <li key={line} className="flex gap-3 text-[15px] leading-relaxed text-ink-2">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </section>

      <h2 id="conditions" className="mt-10 text-2xl text-navy">{L.termsTitle}</h2>
      <div className="mt-4">
        <Sections items={L.terms} />
      </div>

      <h2 id="confidentialite" className="mt-10 text-2xl text-navy">{L.privacyTitle}</h2>
      <div className="mt-4">
        <Sections items={L.privacy} />
      </div>
    </main>
  );
}

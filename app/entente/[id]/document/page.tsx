"use client";

import { ArrowLeft, Download, FileText, Pencil, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { Logo } from "@/components/brand/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState, Spinner } from "@/components/ui/States";
import { buildAgreementDocument } from "@/lib/agreementDoc";
import { agreementOf, isActive, useHouseholdPolling, useHouseholds } from "@/lib/data/households";
import { useMyProfile } from "@/lib/data/profiles";
import { agreementPdf } from "@/lib/pdf";
import { t } from "@/lib/strings";

const D = t.agreement.doc;

export default function AgreementDocumentPage() {
  return (
    <main className="flex flex-1 flex-col">
      <AuthGate>
        <Document />
      </AuthGate>
    </main>
  );
}

function Document() {
  const { id } = useParams<{ id: string }>();
  const [me] = useMyProfile();
  const [store] = useHouseholds();
  const h = store[id];
  const [pdfBusy, setPdfBusy] = useState(false);
  useHouseholdPolling(h ? [h.matchId] : [], 15000);

  const doc = useMemo(
    () => (h ? buildAgreementDocument(agreementOf(h), h.members, h.signatures) : null),
    [h],
  );

  if (!me) return null;
  if (!h || !isActive(h) || !doc) {
    return (
      <EmptyState
        icon={FileText}
        title={!h ? t.household.notFound : t.household.notActive}
        action={<ButtonLink href="/messages">{t.chat.back}</ButtonLink>}
      />
    );
  }

  async function downloadPdf() {
    setPdfBusy(true);
    try {
      const names = h!.members.map((m) => m.firstName).join("-");
      await agreementPdf(doc!, `Entente-colocation-${names}.pdf`);
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col pb-10">
      {/* Toolbar (hidden when printing) */}
      <div className="no-print sticky top-0 z-20 flex min-h-16 items-center gap-2 border-b border-line/60 bg-bg/95 px-3 backdrop-blur">
        <Link
          href={`/messages/${h.matchId}`}
          aria-label={D.back}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-navy hover:bg-navy-50"
        >
          <ArrowLeft className="h-6 w-6" aria-hidden />
        </Link>
        <p className="min-w-0 flex-1 truncate font-display text-lg font-bold text-navy">{D.title}</p>
        <Link
          href={`/entente/${h.id}`}
          aria-label={t.agreement.sign.edit}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-navy hover:bg-navy-50"
        >
          <Pencil className="h-5 w-5" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          aria-label={D.print}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-navy hover:bg-navy-50"
        >
          <Printer className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <article className="mx-4 mt-4 rounded-[24px] bg-card p-6 shadow-soft print:m-0 print:rounded-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-3">
          <Logo size="sm" />
          <span
            className={`rounded-full px-3 py-1 text-[12px] font-medium ${
              doc.signed ? "bg-orange text-navy" : "bg-navy-50 text-ink-2"
            }`}
          >
            {doc.status}
          </span>
        </header>

        <h1 className="mt-6 text-[26px] leading-tight text-navy">{doc.title}</h1>
        <p className="mt-1 text-[15px] text-ink-2">{doc.parties}</p>
        <hr className="my-5 border-line" />

        <div className="space-y-6">
          {doc.sections.map((s) => (
            <section key={s.title} className="break-inside-avoid">
              <h2 className="text-lg text-navy">{s.title}</h2>
              {s.numbered ? (
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-[14px] leading-relaxed text-ink-2">
                  {s.lines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ol>
              ) : (
                <div className="mt-2 space-y-1 text-[14px] leading-relaxed text-ink-2">
                  {s.lines.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                </div>
              )}
              {s.table ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[320px] border-separate border-spacing-1 text-[12px]">
                    <thead>
                      <tr>
                        {s.table.head.map((c, i) => (
                          <th key={i} scope="col" className="whitespace-nowrap px-1 text-center font-medium text-ink-2 first:text-left">
                            {c || <span className="sr-only">{t.agreement.chores.title}</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.table.rows.map((r) => (
                        <tr key={r[0]}>
                          {r.map((c, i) =>
                            i === 0 ? (
                              <th key={i} scope="row" className="pr-1 text-left font-medium leading-tight text-navy">
                                {c}
                              </th>
                            ) : (
                              <td key={i} className="rounded-lg bg-navy-50 px-1 py-1.5 text-center text-navy">
                                {c}
                              </td>
                            ),
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          ))}

          <section className="break-inside-avoid">
            <h2 className="text-lg text-navy">{D.sections.signatures}</h2>
            <ul className="mt-3 grid grid-cols-2 gap-5">
              {doc.signatures.map((s) => (
                <li key={s.member.id}>
                  <p className="min-h-9 font-display text-xl italic text-navy">{s.signature?.name ?? ""}</p>
                  <div className="border-t border-navy pt-1.5 text-[12px] text-ink-2">
                    <span className="font-medium text-navy">{s.member.firstName}</span> · {s.line}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className="mt-8 rounded-2xl bg-navy-50 p-4 text-[12px] leading-relaxed text-ink-2">{doc.disclaimer}</p>
        <p className="mt-3 text-right text-[11px] text-ink-2">{D.generatedBy}</p>
      </article>

      <div className="no-print mx-4 mt-5 grid grid-cols-2 gap-3">
        <Button variant="secondary" className="h-12" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden />
          {D.print}
        </Button>
        <Button className="h-12" onClick={() => void downloadPdf()} disabled={pdfBusy}>
          {pdfBusy ? <Spinner className="h-4 w-4" label={D.generating} /> : <Download className="h-4 w-4" aria-hidden />}
          {pdfBusy ? D.generating : D.pdf}
        </Button>
      </div>
    </div>
  );
}

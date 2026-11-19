"use client";

/* eslint-disable @next/next/no-img-element -- data: URLs / storage URLs */
import { ChevronRight, FileSignature, Heart, MapPinned, MessageCircle, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { ProfileSheet } from "@/components/discover/ProfileSheet";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { computeCompatibility } from "@/lib/compat";
import { isActive, useHouseholdPolling, useHouseholds } from "@/lib/data/households";
import { useMyProfile } from "@/lib/data/profiles";
import { isFullySigned } from "@/lib/agreement";
import { syncFromServer, useMatches, type Match } from "@/lib/data/swipes";
import { formatShortDate } from "@/lib/format";
import { SCHOOLS } from "@/lib/schools";
import { t } from "@/lib/strings";

export default function MatchesPage() {
  const [me] = useMyProfile();
  const [matches] = useMatches();
  const [opened, setOpened] = useState<Match | null>(null);
  const [households] = useHouseholds();
  const active = Object.values(households).filter(isActive);
  useHouseholdPolling(matches.map((m) => m.id), 20000);

  useEffect(() => {
    void syncFromServer().catch(() => undefined);
  }, []);

  if (!me) return null;

  return (
    <>
      <PageHeader
        title={t.matches.title}
        right={
          matches.length ? <span className="text-sm text-ink-2">{t.matches.count(matches.length)}</span> : null
        }
      />
      {matches.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t.matches.emptyTitle}
          body={t.matches.emptyBody}
          action={<ButtonLink href="/decouvrir">{t.matches.cta}</ButtonLink>}
        />
      ) : (
        <>
        {active.length ? (
          <section className="px-4 pt-4" aria-labelledby="households-h">
            <h2 id="households-h" className="mb-2 text-lg text-navy">
              {t.commit.householdsTitle}
            </h2>
            <ul className="space-y-3">
              {active.map((h) => {
                const signed = Boolean(h.agreement) && isFullySigned(h.signatures, h.members);
                return (
                  <li key={h.id} className="rounded-[20px] border border-navy bg-card p-4 shadow-soft">
                    <div className="flex items-center gap-3">
                      <span className="flex -space-x-3">
                        {h.members.map((m) => (
                          <span key={m.id} className="block h-10 w-10 overflow-hidden rounded-full border-2 border-card bg-navy-50">
                            {m.photo ? <img src={m.photo} alt="" className="h-full w-full object-cover" /> : null}
                          </span>
                        ))}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-lg font-bold text-navy">
                          {h.members.map((m) => (m.id === me.id ? t.area.you : m.firstName)).join(" + ")}
                        </span>
                        <span className="block text-[13px] text-ink-2">{signed ? t.commit.signed : t.commit.draft}</span>
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <ButtonLink
                        href={signed ? `/entente/${h.id}/document` : `/entente/${h.id}`}
                        variant="dark"
                        className="min-h-11 text-sm"
                      >
                        <FileSignature className="h-4 w-4" aria-hidden />
                        {t.commit.agreement}
                      </ButtonLink>
                      <ButtonLink href={`/depenses/${h.id}`} variant="secondary" className="min-h-11 text-sm">
                        <Wallet className="h-4 w-4" aria-hidden />
                        {t.commit.expenses}
                      </ButtonLink>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
        <ul className="space-y-3 px-4 py-4">
          {matches.map((m) => {
            const score = computeCompatibility(me, m.profile).score;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setOpened(m)}
                  className="flex w-full items-center gap-4 rounded-[20px] bg-card p-3 text-left shadow-soft transition-colors hover:bg-navy-50"
                >
                  <span className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-navy-50">
                    {m.profile.photos[0] ? (
                      <img
                        src={m.profile.photos[0]}
                        alt={t.card.photoAlt(m.profile.firstName, 1, m.profile.photos.length)}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-bold text-navy">
                      {m.profile.firstName}, {m.profile.age}
                    </span>
                    <span className="block truncate text-sm text-ink-2">
                      {SCHOOLS[m.profile.school].short} · {m.profile.program}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-ink-2">
                      {t.matches.since(formatShortDate(m.createdAt))}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-[13px] font-medium text-navy">
                    {score} %
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-ink-2" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
        </>
      )}

      <ProfileSheet
        profile={opened?.profile ?? null}
        compat={opened ? computeCompatibility(me, opened.profile) : undefined}
        onClose={() => setOpened(null)}
        footer={
          opened ? (
            <div className="flex gap-3 pb-3">
              <ButtonLink href={`/quartier?avec=${opened.id}`} variant="secondary" className="h-14 flex-1">
                <MapPinned className="h-5 w-5" aria-hidden />
                {t.area.short}
              </ButtonLink>
              <ButtonLink href={`/messages/${opened.id}`} className="h-14 flex-[1.4] text-base">
                <MessageCircle className="h-5 w-5" aria-hidden />
                {t.chat.message}
              </ButtonLink>
            </div>
          ) : undefined
        }
      />
    </>
  );
}

"use client";

/* eslint-disable @next/next/no-img-element -- data: URLs / storage URLs */
import { ChevronRight, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { ProfileSheet } from "@/components/discover/ProfileSheet";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { computeCompatibility } from "@/lib/compat";
import { useMyProfile } from "@/lib/data/profiles";
import { syncFromServer, useMatches, type Match } from "@/lib/data/swipes";
import { formatShortDate } from "@/lib/format";
import { SCHOOLS } from "@/lib/schools";
import { t } from "@/lib/strings";

export default function MatchesPage() {
  const [me] = useMyProfile();
  const [matches] = useMatches();
  const [opened, setOpened] = useState<Match | null>(null);

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
      )}

      <ProfileSheet
        profile={opened?.profile ?? null}
        compat={opened ? computeCompatibility(me, opened.profile) : undefined}
        onClose={() => setOpened(null)}
      />
    </>
  );
}

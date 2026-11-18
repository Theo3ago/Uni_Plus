"use client";

import { Check, Compass, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiltersSheet } from "@/components/discover/FiltersSheet";
import { MatchOverlay } from "@/components/discover/MatchOverlay";
import { ProfileSheet } from "@/components/discover/ProfileSheet";
import { SwipeCounter } from "@/components/discover/SwipeCounter";
import { SwipeDeck, type DeckItem } from "@/components/discover/SwipeDeck";
import { Logo } from "@/components/brand/Logo";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { computeCompatibility } from "@/lib/compat";
import { DEMO_MODE } from "@/lib/config";
import { scheduleDemoOpener } from "@/lib/data/messages";
import { listCandidates, useMyProfile } from "@/lib/data/profiles";
import { consumeSwipe, hasSwipeLeft } from "@/lib/data/quota";
import {
  activeFilterCount,
  applyFilters,
  clearPasses,
  DEFAULT_FILTERS,
  recordSwipe,
  syncFromServer,
  useFilters,
  useSwipes,
  type Match,
} from "@/lib/data/swipes";
import { t } from "@/lib/strings";
import type { Profile } from "@/lib/types";

export default function DiscoverPage() {
  const router = useRouter();
  const [me] = useMyProfile();
  const [swipes] = useSwipes();
  const [filters, setFilters] = useFilters();
  const [candidates, setCandidates] = useState<Profile[] | null>(null);
  const [opened, setOpened] = useState<DeckItem | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([listCandidates(), syncFromServer().catch(() => undefined)])
      .then(([p]) => alive && setCandidates(p))
      .catch(() => alive && setCandidates([]));
    return () => {
      alive = false;
    };
  }, []);

  // Unswiped, filtered, best compatibility first.
  const items = useMemo<DeckItem[]>(() => {
    if (!candidates || !me) return [];
    return applyFilters(candidates, filters, me)
      .filter((p) => !swipes[p.id] && p.id !== me.id)
      .map((profile) => ({ profile, compat: computeCompatibility(me, profile) }))
      .sort((a, b) => b.compat.score - a.compat.score);
  }, [candidates, filters, me, swipes]);

  const onBlocked = useCallback(() => router.push("/forfaits"), [router]);

  const onSwipe = useCallback(async (item: DeckItem, liked: boolean) => {
    if (!consumeSwipe()) return;
    const m = await recordSwipe(item.profile, liked).catch(() => null);
    if (m) {
      setMatch(m);
      scheduleDemoOpener(m); // demo: they say hello first, a moment later
    }
  }, []);

  // Like / pass from the expanded profile.
  async function decideFromSheet(liked: boolean) {
    if (!opened) return;
    if (!hasSwipeLeft()) return onBlocked();
    const item = opened;
    setOpened(null);
    await onSwipe(item, liked);
  }

  if (!me) return null;
  const filterCount = activeFilterCount(filters);
  const hasSwiped = Object.values(swipes).some((d) => d === "pass");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title={<Logo size="sm" />}
        right={
          <>
            <SwipeCounter />
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label={filterCount ? `${t.filters.open} (${t.filters.active(filterCount)})` : t.filters.open}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card text-navy"
            >
              <SlidersHorizontal className="h-5 w-5" aria-hidden />
              {filterCount ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1 text-[11px] font-medium text-navy">
                  {filterCount}
                </span>
              ) : null}
            </button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 pt-3">
        {candidates === null ? (
          <div className="flex flex-1 flex-col pb-[96px]" aria-busy>
            <div className="flex flex-1 flex-col overflow-hidden rounded-[24px] bg-card shadow-soft">
              <Skeleton className="flex-1 rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Compass}
            title={t.discover.emptyTitle}
            body={filterCount ? t.discover.emptyFiltered : t.discover.emptyBody}
            action={
              filterCount ? (
                <Button variant="dark" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  {t.discover.resetFilters}
                </Button>
              ) : DEMO_MODE && hasSwiped ? (
                <Button variant="dark" onClick={clearPasses}>
                  {t.discover.restartDemo}
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <p className="sr-only">{t.discover.deckHint}</p>
            <SwipeDeck
              items={items}
              canSwipe={hasSwipeLeft}
              onBlocked={onBlocked}
              onSwipe={(item, liked) => void onSwipe(item, liked)}
              onOpen={setOpened}
            />
          </>
        )}
      </div>

      <ProfileSheet
        profile={opened?.profile ?? null}
        compat={opened?.compat}
        onClose={() => setOpened(null)}
        footer={
          <div className="flex gap-3 pb-3">
            <Button variant="secondary" className="h-14 flex-1" onClick={() => void decideFromSheet(false)}>
              <X className="h-5 w-5" aria-hidden />
              {t.discover.pass}
            </Button>
            <Button className="h-14 flex-1" onClick={() => void decideFromSheet(true)}>
              <Check className="h-5 w-5" aria-hidden />
              {t.discover.like}
            </Button>
          </div>
        }
      />

      <FiltersSheet
        open={filtersOpen}
        value={filters}
        onClose={() => setFiltersOpen(false)}
        onApply={(f) => {
          setFilters(f);
          setFiltersOpen(false);
        }}
      />

      <MatchOverlay match={match} me={me} onClose={() => setMatch(null)} />
    </div>
  );
}

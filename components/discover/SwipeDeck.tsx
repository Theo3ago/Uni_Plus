"use client";

import { animate, motion, useMotionValue, useTransform, type MotionValue, type PanInfo } from "framer-motion";
import { CalendarDays, Check, ChevronUp, GraduationCap, MapPin, Wallet, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { CompatBadge, PhotoCarousel } from "@/components/profile/PhotoCarousel";
import type { Compatibility } from "@/lib/compat";
import { formatBudget, formatMonth } from "@/lib/format";
import { SCHOOLS } from "@/lib/schools";
import { t } from "@/lib/strings";
import type { Profile } from "@/lib/types";

export interface DeckItem {
  profile: Profile;
  compat: Compatibility;
}

const SWIPE_DISTANCE = 110;
const SWIPE_VELOCITY = 600;
const FLY_OUT = 520;

/**
 * Tinder-style stack. Only the top card is interactive; the next one waits underneath.
 * `canSwipe` is checked before a card leaves (daily limit); `onSwipe` runs after it has flown out.
 */
export function SwipeDeck({
  items,
  canSwipe,
  onBlocked,
  onSwipe,
  onOpen,
}: {
  items: DeckItem[];
  canSwipe: () => boolean;
  onBlocked: () => void;
  onSwipe: (item: DeckItem, liked: boolean) => void;
  onOpen: (item: DeckItem) => void;
}) {
  const top = items[0];
  const next = items[1];
  // Each top card owns its motion value; the deck drives whichever card is on top.
  const xRef = useRef<MotionValue<number> | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    busy.current = false;
  }, [top?.profile.id]);

  const decide = useCallback(
    async (liked: boolean) => {
      const x = xRef.current;
      if (!top || !x || busy.current) return;
      if (!canSwipe()) {
        animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
        onBlocked();
        return;
      }
      busy.current = true;
      await animate(x, liked ? FLY_OUT : -FLY_OUT, { duration: 0.28, ease: "easeIn" });
      onSwipe(top, liked);
    },
    [top, canSwipe, onBlocked, onSwipe],
  );

  // Laptop shortcuts: ← pass, → like (ignored while a dialog is open or when typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight") void decide(true);
      if (e.key === "ArrowLeft") void decide(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide]);

  if (!top) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        {next ? (
          <div className="absolute inset-0 scale-[0.95] opacity-80" aria-hidden key={`under-${next.profile.id}`}>
            <CardFace item={next} />
          </div>
        ) : null}
        <TopCard key={top.profile.id} item={top} xRef={xRef} onDecide={decide} onOpen={() => onOpen(top)} />
      </div>

      <div className="flex items-center justify-center gap-6 py-4">
        <button
          type="button"
          onClick={() => void decide(false)}
          aria-label={`${t.discover.pass} : ${top.profile.firstName}`}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-card text-navy shadow-soft transition-transform hover:scale-105 active:scale-95"
        >
          <X className="h-7 w-7" strokeWidth={2.25} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onOpen(top)}
          aria-label={`${t.discover.openProfile} : ${top.profile.firstName}`}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-card text-navy shadow-soft transition-transform hover:scale-105 active:scale-95"
        >
          <ChevronUp className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => void decide(true)}
          aria-label={`${t.discover.like} : ${top.profile.firstName}`}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-orange text-navy shadow-soft transition-transform hover:scale-105 active:scale-95"
        >
          <Check className="h-7 w-7" strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </div>
  );
}

function TopCard({
  item,
  xRef,
  onDecide,
  onOpen,
}: {
  item: DeckItem;
  xRef: React.MutableRefObject<MotionValue<number> | null>;
  onDecide: (liked: boolean) => Promise<void>;
  onOpen: () => void;
}) {
  const x = useMotionValue(0);
  useEffect(() => {
    xRef.current = x;
  }, [x, xRef]);
  const rotate = useTransform(x, [-300, 0, 300], [-14, 0, 14]);
  const likeOpacity = useTransform(x, [20, SWIPE_DISTANCE], [0, 1]);
  const passOpacity = useTransform(x, [-SWIPE_DISTANCE, -20], [1, 0]);
  const dragged = useRef(false);

  function onDragEnd(_: unknown, info: PanInfo) {
    const { offset, velocity } = info;
    if (offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY) void onDecide(true);
    else if (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY) void onDecide(false);
    else animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragMomentum={false}
      onPointerDown={() => (dragged.current = false)}
      onDragStart={() => (dragged.current = true)}
      onDragEnd={onDragEnd}
      onClick={() => !dragged.current && onOpen()}
      initial={{ scale: 0.95, opacity: 0.8 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <CardFace item={item} />
      <motion.span
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute left-5 top-8 -rotate-12 rounded-xl border-4 border-orange bg-card/90 px-3 py-1 font-display text-3xl font-bold text-navy"
        aria-hidden
      >
        {t.discover.stampLike}
      </motion.span>
      <motion.span
        style={{ opacity: passOpacity }}
        className="pointer-events-none absolute right-5 top-8 rotate-12 rounded-xl border-4 border-navy bg-card/90 px-3 py-1 font-display text-3xl font-bold text-navy"
        aria-hidden
      >
        {t.discover.stampPass}
      </motion.span>
    </motion.div>
  );
}

function CardFace({ item }: { item: DeckItem }) {
  const { profile, compat } = item;
  return (
    <article
      className="flex h-full select-none flex-col overflow-hidden rounded-[24px] bg-card shadow-lift"
      aria-label={`${profile.firstName}, ${profile.age}`}
    >
      <div className="relative min-h-0 flex-1">
        <PhotoCarousel profile={profile} className="h-full w-full" />
        <div className="pointer-events-none absolute bottom-3 left-3">
          <CompatBadge score={compat.score} />
        </div>
      </div>
      <div className="space-y-2 px-5 pb-4 pt-3">
        <h2 className="text-[26px] leading-tight text-navy">
          {profile.firstName}, <span className="font-medium">{profile.age}</span>
        </h2>
        <p className="flex items-center gap-2 text-[15px] text-ink-2">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          <span className="shrink-0">{SCHOOLS[profile.school].short}</span>
          <span aria-hidden>·</span>
          <GraduationCap className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{profile.program}</span>
        </p>
        <p className="flex items-center gap-2 text-[15px] text-ink-2">
          <Wallet className="h-4 w-4 shrink-0" aria-hidden />
          <span>{formatBudget(profile.budget.min, profile.budget.max)}</span>
          <span aria-hidden>·</span>
          <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{formatMonth(profile.moveIn)}</span>
        </p>
      </div>
    </article>
  );
}

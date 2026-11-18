"use client";

/* eslint-disable @next/next/no-img-element -- photos are data: URLs or Supabase URLs */
import { useState } from "react";
import { t } from "@/lib/strings";
import type { Profile } from "@/lib/types";

/** Tap the left/right half of the photo to browse. Bars at the top show the position. */
export function PhotoCarousel({ profile, className = "" }: { profile: Profile; className?: string }) {
  const [index, setIndex] = useState(0);
  const photos = profile.photos.length ? profile.photos : [];
  const n = photos.length;
  const go = (delta: number) => setIndex((i) => Math.min(n - 1, Math.max(0, i + delta)));

  return (
    <div className={`relative overflow-hidden bg-navy-50 ${className}`}>
      {n > 0 ? (
        <img
          src={photos[index]}
          alt={t.card.photoAlt(profile.firstName, index + 1, n)}
          className="h-full w-full select-none object-cover"
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-display text-6xl font-bold text-navy">
          {profile.firstName.slice(0, 1)}
        </div>
      )}

      {n > 1 ? (
        <>
          <div className="absolute inset-x-3 top-3 flex gap-1.5" aria-hidden>
            {photos.map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${i === index ? "bg-white" : "bg-white/45"}`}
              />
            ))}
          </div>
          <span className="sr-only" aria-live="polite">
            {t.card.photoOf(index + 1, n)}
          </span>
          <button
            type="button"
            aria-label={t.card.prevPhoto}
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            disabled={index === 0}
            className="absolute inset-y-0 left-0 w-1/3 cursor-pointer disabled:cursor-default"
          />
          <button
            type="button"
            aria-label={t.card.nextPhoto}
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            disabled={index === n - 1}
            className="absolute inset-y-0 right-0 w-1/3 cursor-pointer disabled:cursor-default"
          />
        </>
      ) : null}
    </div>
  );
}

export function CompatBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange px-3 py-1.5 text-sm font-medium text-navy shadow-soft">
      {score} %<span className="font-medium">{t.discover.compatibility}</span>
    </span>
  );
}

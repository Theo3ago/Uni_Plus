"use client";

import { Infinity as InfinityIcon } from "lucide-react";
import Link from "next/link";
import { useSwipeQuota } from "@/lib/data/quota";
import { t } from "@/lib/strings";

/** "8 swipes restants" pill; opens the swipe packs page. */
export function SwipeCounter() {
  const { remaining, unlimited } = useSwipeQuota();
  const low = !unlimited && remaining <= 3;
  return (
    <Link
      href="/forfaits"
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium ${
        low ? "border-[#F6D3BA] bg-orange-50 text-navy" : "border-line bg-card text-navy"
      }`}
      aria-live="polite"
    >
      {unlimited ? (
        <>
          <InfinityIcon className="h-4 w-4" aria-hidden />
          {t.discover.unlimited}
        </>
      ) : (
        <>
          <span className={`h-2 w-2 rounded-full ${low ? "bg-orange" : "bg-navy"}`} aria-hidden />
          {t.discover.swipesLeft(remaining)}
        </>
      )}
    </Link>
  );
}

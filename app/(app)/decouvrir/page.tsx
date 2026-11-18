"use client";

import { Compass } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { DemoBadge, PageHeader } from "@/components/layout/PageHeader";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { listCandidates } from "@/lib/data/profiles";
import { t } from "@/lib/strings";
import type { Profile } from "@/lib/types";

// Step 1 preview: shows the top card of the stack. Swiping arrives in step 3.
export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);

  useEffect(() => {
    let alive = true;
    listCandidates()
      .then((p) => alive && setProfiles(p))
      .catch(() => alive && setProfiles([]));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <PageHeader title={<Logo size="sm" />} right={<DemoBadge />} />
      <div className="flex-1 px-4 py-4">
        {profiles === null ? (
          <div className="overflow-hidden rounded-[24px] bg-card shadow-soft" aria-busy>
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        ) : profiles.length === 0 ? (
          <EmptyState icon={Compass} title={t.discover.emptyTitle} body={t.discover.emptyBody} />
        ) : (
          <ProfileCard profile={profiles[0]} />
        )}
      </div>
    </>
  );
}

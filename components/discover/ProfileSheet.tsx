"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { CompatBadge, PhotoCarousel } from "@/components/profile/PhotoCarousel";
import { ProfileDetails } from "@/components/profile/ProfileDetails";
import { Sheet } from "@/components/ui/Sheet";
import type { Compatibility } from "@/lib/compat";
import { SCHOOLS } from "@/lib/schools";
import { t } from "@/lib/strings";
import type { Profile } from "@/lib/types";

/** Full profile in a full-height panel: photos, compatibility reasons, all sections. */
export function ProfileSheet({
  profile,
  compat,
  onClose,
  footer,
}: {
  profile: Profile | null;
  compat?: Compatibility;
  onClose: () => void;
  footer?: ReactNode;
}) {
  return (
    <Sheet
      open={Boolean(profile)}
      onClose={onClose}
      title={profile ? `${profile.firstName}, ${profile.age}` : ""}
      hideTitle
      variant="full"
      footer={footer}
    >
      {profile ? (
        <div className="pb-6">
          <PhotoCarousel profile={profile} className="aspect-[4/5] w-full" />
          <div className="space-y-4 px-4 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-[28px] font-bold leading-tight text-navy">
                  {profile.firstName}, <span className="font-medium">{profile.age}</span>
                </p>
                <p className="mt-0.5 text-[15px] text-ink-2">
                  {SCHOOLS[profile.school].short} · {profile.program}
                </p>
              </div>
              {compat ? <CompatBadge score={compat.score} /> : null}
            </div>

            {compat?.reasons.length ? (
              <section className="rounded-[20px] border border-[#F6D3BA] bg-orange-50 p-5">
                <h3 className="mb-3 text-lg text-navy">{t.discover.whyMatch}</h3>
                <ul className="space-y-2.5">
                  {compat.reasons.map((r) => (
                    <li key={r} className="flex items-start gap-3 text-[15px] text-navy">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange">
                        <Check className="h-3 w-3 text-navy" strokeWidth={3} aria-hidden />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <ProfileDetails profile={profile} />
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}

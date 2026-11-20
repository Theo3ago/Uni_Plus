"use client";

import { FileText, LogOut, Pencil, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { DemoBadge, PageHeader } from "@/components/layout/PageHeader";
import { PhotoCarousel } from "@/components/profile/PhotoCarousel";
import { ProfileDetails } from "@/components/profile/ProfileDetails";
import { Button, ButtonLink } from "@/components/ui/Button";
import { DEMO_MODE } from "@/lib/config";
import { signOut } from "@/lib/data/auth";
import { useMyProfile } from "@/lib/data/profiles";
import { SCHOOLS } from "@/lib/schools";
import { t } from "@/lib/strings";

export default function ProfilePage() {
  const router = useRouter();
  const [me] = useMyProfile();
  if (!me) return null; // AuthGate redirects to onboarding

  async function leave() {
    if (DEMO_MODE && !window.confirm(t.profile.resetDemoConfirm)) return;
    await signOut();
    router.replace(DEMO_MODE ? "/bienvenue" : "/");
  }

  return (
    <>
      <PageHeader title={t.profile.title} right={<DemoBadge />} />
      <div className="space-y-4 px-4 pb-8 pt-4">
        <div className="overflow-hidden rounded-[24px] bg-card shadow-soft">
          <PhotoCarousel profile={me} className="aspect-[4/5] w-full" />
          <div className="flex items-end justify-between gap-3 p-5">
            <div className="min-w-0">
              <h2 className="text-[26px] leading-tight text-navy">
                {me.firstName}, <span className="font-medium">{me.age}</span>
              </h2>
              <p className="mt-1 truncate text-[15px] text-ink-2">{SCHOOLS[me.school].short}</p>
            </div>
            <ButtonLink href="/modifier-profil" variant="dark" className="shrink-0">
              <Pencil className="h-4 w-4" aria-hidden />
              {t.profile.edit}
            </ButtonLink>
          </div>
        </div>

        <ProfileDetails profile={me} />

        <Button variant="secondary" className="w-full" onClick={() => void leave()}>
          {DEMO_MODE ? <RotateCcw className="h-4 w-4" aria-hidden /> : <LogOut className="h-4 w-4" aria-hidden />}
          {DEMO_MODE ? t.profile.resetDemo : t.profile.signOut}
        </Button>
        <ButtonLink href="/conditions" variant="ghost" className="w-full">
          <FileText className="h-4 w-4" aria-hidden />
          {t.legal.profileLink}
        </ButtonLink>
      </div>
    </>
  );
}

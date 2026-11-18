"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthGate, FullScreenSpinner } from "@/components/auth/AuthGate";
import { ProfileWizard } from "@/components/profile/ProfileWizard";
import { useMyProfile } from "@/lib/data/profiles";

export default function OnboardingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <AuthGate requireProfile={false}>
        <Onboarding />
      </AuthGate>
    </main>
  );
}

function Onboarding() {
  const router = useRouter();
  const [me] = useMyProfile();
  // Already has a profile → straight to the app.
  useEffect(() => {
    if (me) router.replace("/decouvrir");
  }, [me, router]);
  if (me) return <FullScreenSpinner />;
  return <ProfileWizard mode="create" />;
}
